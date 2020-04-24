'use strict';
/**
 * Load Module Dependencies.
 */
const crypto  = require('crypto');
const path    = require('path');
const url     = require('url');

const debug      = require('debug')('api:group-controller');
const moment     = require('moment');
const jsonStream = require('streaming-json-stringify');
const _          = require('lodash');
const co         = require('co');
const del        = require('del');
const validator  = require('validator');

const config              = require('../config');
const CustomError         = require('../lib/custom-error');
const checkPermissions    = require('../lib/permissions');
const LOAN                = require ('../lib/loan');

const Group               = require('../models/group');
const GroupScreening      = require('../models/groupScreening');
const GroupLoan           = require('../models/groupLoan');
const GroupACAT           = require ('../models/groupACAT')
const Account             = require('../models/account');
const Question           = require('../models/question');
const Form               = require('../models/form');
const Section            = require('../models/section');
const Screening          = require('../models/screening');
const Loan               = require('../models/loan');
const GroupHistory       = require('../models/groupHistory');
const ClientACAT         = require('../models/clientACAT');

const TokenDal            = require('../dal/token');
const GroupDal            = require('../dal/group');
const GroupLoanDal        = require('../dal/groupLoan');
const ClientDal           = require('../dal/client');
const LogDal              = require('../dal/log');
const NotificationDal     = require('../dal/notification');
const TaskDal             = require('../dal/task');
const LoanDal            = require('../dal/loan');
const FormDal            = require('../dal/form');
const AccountDal         = require('../dal/account');
const SectionDal         = require('../dal/section');
const QuestionDal        = require('../dal/question');

const COMPRESSOR         = require('../lib/compress');


let hasPermission         = checkPermissions.isPermitted('GROUP');

let loanService = null;

/**
 * Create a loan application.
 *
 * @desc create a loan using basic Authentication or Social Media
 *
 * @param {Function} next Middleware dispatcher
 *
 */

exports.initializeGroupLoan = function* initializeGroupLoan(next){
  debug('create loan for Group');

  let isPermitted = yield hasPermission(this.state._user, 'CREATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_LOAN_CREATION_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }
  

  try {    

    //0. Do validations 
    let groupId = this.params.groupId;
    let group = yield Group.findOne({ _id: groupId }).exec();
    if (!group) {
      throw new Error("Group Does Not Exist!");
    }

    if (group.status === "new"){
      throw new Error ("The group is in pre-screening stage. Thus loan applications can not be created.");
    }

       
    let loan = yield validateGroupCycle({group: this.params.groupId});

    let history = yield GroupHistory.findOne({group: this.params.groupId}).exec();
    if (!history) {
      throw new Error('Group Has No Loan History');

    } else {
      history = history.toJSON();}

    let cycleOk = true;
    let loanPresent = true;
    let whichCycle = history.cycle_number;
    let missingApplications = [];

    let cycles = history.cycles;
    let currentCycleIndex = cycles.findIndex(cycle => cycle.cycle_number == whichCycle);
    let currentCycle = cycles[currentCycleIndex];
    if (currentCycle){
      if (!currentCycle.screening) {
        !currentCycle.screening ? missingApplications.push('Screening') : null;
        cycleOk = false;        
      } else if (currentCycle.loan) {
        loanPresent = false;        
      }
    }

    if (!cycleOk) {
      throw new Error(`Loan Cycle (${whichCycle}) is in progress. Missing ${missingApplications.join(', ')} Application(s)`);
    }

    if (!loanPresent) {
      throw new Error(`Loan Cycle (${whichCycle}) is in progress. Move To A-CAT Application(s)`);
    }
    
    
    // 1. Initialize Group Loan Object and set group status to loan_application_new
     let groupLoanBody = {
       group: groupId,
       created_by: this.state._user._id
     }     

     let groupLoan = yield GroupLoanDal.create(groupLoanBody); 
    //  let query = {
    //   group: groupId
    // };
    //  let groupLoan = yield GroupLoanDal.get(query);

     let groupUpdated = yield GroupDal.update({ _id: groupId },{"status":"loan_application_new"});

     //2. Create loan applications for all members and add it to group loan object
     loanService = new LOAN({headers: this. request.header});
     let loanApps = [];
     let members = group.members;
     let newLoanApp = {};
     loanApps = groupLoan.loans;
     for (let member of members){
      //let loanApp = yield loanService.getLoanApplication (member);
      //if (!loanApp){
        newLoanApp = yield loanService.createLoanApplication (member);       
        loanApps.push (newLoanApp._id);
      //}
     }      
    

     //3. Update Group Loan object with loan applicatons of members     
     let updatedGroupLoan = yield GroupLoanDal.update ({_id: groupLoan._id}, {loans: loanApps});


     //4. Update the history of the current loan cycle
     cycles[currentCycleIndex].loan = groupLoan._id;
     cycles[currentCycleIndex].last_edit_by = this.state._user._id;
     cycles[currentCycleIndex].last_modified = moment().toISOString();

     yield GroupHistory.findOneAndUpdate({
          _id: history._id
        },{
          $set: {
            cycles: cycles,
            last_modified:  moment().toISOString()
          }
        }).exec();
     
     //5. return the updated group loan object
    this.body = updatedGroupLoan;

  } catch (ex){
    let message = "";
    if (ex.message.includes ('Client Has No Loan Application')){
      message = "One of the members has no loan application."
    }
    else if (ex.message.includes ('Loan Cycle ')){
      message = "One of the members has an unfinished loan cycle."
    }
    else if (ex.message.includes ('Client Has A Loan')){
      message = "One of the members has a loan application which is in progress."
    }
    else if (ex.message.includes ('Client Has A Screening')){
      message = "One of the members has a screening which is in progress."
    }
    else
      message = ex.message;

    return this.throw(new CustomError({
      type: 'GROUP_LOAN_INITIALIZE_ERROR',      
      message: message
    }));

   }

}


exports.createForClient = function* createLoan(next) {
  debug('create loan for client');

  let body = this.request.body;

  this.checkBody('client')
      .notEmpty('Loan Client is Empty');

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'GROUP_CLIENT_LOAN_CREATION_ERROR',
      message: JSON.stringify(this.errors)
    }));
  }

  try {
    let group = yield Group.findOne({ _id: this.params.id }).exec();
    if (!group) {
      throw new Error("Group Does Not Exist!")
    }

    let client = yield ClientDal.get({ _id: body.client });
    if(!client) {
      throw new Error('Client Does Not Exist!!');
    }
   
    let isMember = group.members.some((member)=>{
      return member.toString() == body.client
    });
     if (!isMember) {
      throw new Error("Client Is Not Part Of this Group!")
    }

    let groupLoan = yield GroupLoan.findOne({ group: group._id }).exec();
    
    for(let _loan of groupLoan.loans){
      _loan = yield Loan.findOne({ _id: _loan }).exec();
      if (_loan.client == client._id) {
        throw new Error("Client Has A Loan Application Already!")
      }
    }

    let loanForm = yield FormDal.get({ type: 'LOAN_APPLICATION' });
    if(!loanForm || !loanForm._id) {
      throw new Error('Loan Form Is Needed To Be Created In Order To Continue!')
    }

    let loan = yield validateCycle(body)

  /*  let history = yield History.findOne({client: client._id}).exec()
    if (!history) {
      throw new Error('Client Has No Loan History');

    } else {
      history = history.toJSON();

      let cycleOk = true;
      let loanPresent = true;
      let whichCycle = history.cycle_number;
      let missingApplications = [];

      for(let cycle of history.cycles) {
        if (cycle.cycle_number === history.cycle_number) {
          if (!cycle.screening) {
            !cycle.screening ? missingApplications.push('Screening') : null;
            cycleOk = false;
            break;
          } else if (cycle.loan) {
            loanPresent = false;
            break;
          }
        }
      }

      if (!cycleOk) {
        throw new Error(`Loan Cycle (${whichCycle}) is in progress. Missing ${missingApplications.join(', ')} Application(s)`);
      }

      if (!loanPresent) {
        throw new Error(`Loan Cycle (${whichCycle}) is in progress. Move To ACAT Application(s)`);
      }
    }*/


    // Create New Loan
    let questions = [];
    let sections = [];
    let loanBody = {};
    loanForm = loanForm.toJSON();

    // Create Answer Types
   PREQS = [];
    for(let question of loanForm.questions) {
      question = yield createQuestion(question);

      if(question) {
        questions.push(question._id);
      }
    }

    yield createPrerequisites();

    // Create Section Types
    PREQS = [];
    for(let section of loanForm.sections) {
      section = yield Section.findOne({ _id: section }).exec();
      if(!section) continue;
      section = section.toJSON();

      let _questions = [];
      delete section._id;
      if(section.questions.length) {

        for(let question of section.questions) {
          PREQS = [];
          question = yield createQuestion(question);
          if(question) {

            _questions.push(question._id);
          }

          
        }

      }

      section.questions = _questions;

      let _section = yield SectionDal.create(section);

      sections.push(_section._id);
    }

    yield createPrerequisites();

    loanBody.questions = questions.slice();
    loanBody.sections = sections.slice();
    loanBody.client = client._id;
    loanBody.title = 'Loan Form';
    loanBody.subtitle = loanForm.subtitle;
    loanBody.purpose = `Group Loan Application For ${client.first_name} ${client.last_name}`;
    loanBody.layout = loanForm.layout;
    loanBody.has_sections = loanForm.has_sections;
    loanBody.disclaimer = loanForm.disclaimer;
    loanBody.signatures = loanForm.signatures.slice();
    loanBody.created_by = client.created_by;
    loanBody.branch = client.branch._id;
    loanBody.for_group = true;

    // Create Loan Type
    loan = yield LoanDal.create(loanBody);

    yield ClientDal.update({ _id: client._id }, { status: 'loan_application_new'});

/*    if (history) {
      let cycles = history.cycles.slice();

      for(let cycle of cycles) {
        if (cycle.cycle_number === history.cycle_number) {
          cycle.loan = loan._id;
          cycle.last_edit_by = this.state._user._id;
          cycle.last_modified = moment().toISOString();
        }
      }

      yield History.findOneAndUpdate({
        _id: history._id
      },{
        $set: {
          cycles: cycles,
          last_modified:  moment().toISOString()
        }
      }).exec()
    }
*/

    yield GroupLoanDal.update({ _id: groupLoan._id },{
      loans: groupLoan.loans.slice().push(loan._id)
    })

    this.body = loan;

  } catch(ex) {
    console.log(ex)
    this.throw(new CustomError({
      type: 'GROUP_CLIENT_LOAN_CREATION_ERROR',
      message: ex.message
    }));
  }

};


/**
 * Create a group loan.
 *
 * @desc Fetch a group with the given id from the database.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.create = function* createGroupLoan(next) {
  debug(`create group loan`);

  let isPermitted = yield hasPermission(this.state._user, 'CREATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_LOAN_CREATION_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }


  let body = this.request.body;

  this.checkBody('group')
      .notEmpty('Group Reference is Empty');

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'GROUP_LOAN_CREATION_ERROR',
      message: JSON.stringify(this.errors)
    }));
  }

  try {
    let group = yield GroupDal.get({ _id: body.group });
    if (!group) {
      throw new Error("Group Does Not Exist!")
    }

    // Create Group Type
    body.created_by = this.state._user._id;

    let groupLoan = yield GroupLoanDal.create(body);

    let groupUpdated = yield GroupDal.update({ _id: body.group },{"status":"loan_application_new"});

    //Update Group History by recording the group loan
    let history = yield GroupHistoryDal.get ({group: body.group});
    

    this.body = groupLoan;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_LOAN_VIEW_ERROR',
      message: ex.message
    }));
  }

};

/**
 * Get a single group.
 *
 * @desc Fetch a group with the given id from the database.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchOne = function* fetchOneGroupLoan(next) {
  debug(`fetch group loan: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_LOAN_VIEW_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    group: this.params.id
  };

  try {
    let groupLoan = yield GroupLoanDal.get(query, "last");

    yield LogDal.track({
      event: 'view_group_loan',
      group: this.state._user._id ,
      message: `View group - ${groupLoan._id}`
    });

    this.body = groupLoan;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_LOAN_VIEW_ERROR',
      message: ex.message
    }));
  }

};


/**
 * Update a single group.
 *
 * @desc Fetch a group with the given id from the database
 *       and update their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.update = function* updateGroupLoan(next) {
  debug(`updating group Loan: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_LOAN_UPDATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    _id: this.params.id
  };
  let body = this.request.body;

  try {

    
//added as a remedy to update for_group of loan applications
//but needed to be removed 
    if (body.loans){
      for (let loan of body.loans){
        yield LoanDal.update({_id: loan},{for_group: true});

      }

    }

    let groupLoan = yield GroupLoanDal.update(query, body);

    yield LogDal.track({
      event: 'group_loan_update',
      group: this.state._user._id ,
      message: `Update Info for ${groupLoan._id}`,
      diff: body
    });

    this.body = groupLoan;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_UPDATE_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Get a collection of groups by Pagination
 *
 * @desc Fetch a collection of groups
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchAllByPagination = function* fetchAllGroupLoans(next) {
  debug('get a collection of group loans by pagination');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_LOANS_VIEW_COLLECTION_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;
  let query  = {};

  let sortType = this.query.sort_by;
  let sort     = {};
  sortType ? (sort[sortType] = 1) : null;

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };

  try {
    let canViewAll  =  yield hasPermission(this.state._user, 'VIEW_ALL');
    let canView     =  yield hasPermission(this.state._user, 'VIEW');
    let user        = this.state._user;
    let account     = yield Account.findOne({ user: user._id }).exec();

    // Super Admin
    if (!account || (account.multi_branches)) {
        query = {};

    // Can VIEW ALL
    } else if (canViewAll) {
      if(account.access_branches.length) {
        query = {
            branch: { $in: account.access_branches.slice() }
        }

      } else if(account.default_branch) {
          query = {
              branch: account.default_branch
          }
      }
    } else if(canView) {
      query.created_by = user._id;  

    // DEFAULT
    } else {
      query = {
        created_by: user._id
      };
    }

    let groups = yield GroupDal.getCollectionByPagination(query, {
      page: opts.page,
      limit: opts.limit * 2,
      sort: sort
    });

    let ids = [];
    for(let doc of groups.docs) {
      ids.push(doc._id)
    }

    let groupLoans = yield GroupLoanDal.getCollectionByPagination({
      "group": { $in: ids }
    }, opts);

    this.body = groupLoans;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_LOANS_VIEW_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};

exports.fetchOngoingPagination = function* fetchOngoingGroupLoans(next) {
  debug('get a collection of ongoing group loans by pagination');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_LOANS_VIEW_COLLECTION_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;
  let query  = {};

  let sortType = this.query.sort_by;
  let sort     = {};
  sortType ? (sort[sortType] = 1) : null;

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };

  try {
    let canViewAll  =  yield hasPermission(this.state._user, 'VIEW_ALL');
    let canView     =  yield hasPermission(this.state._user, 'VIEW');
    let user        = this.state._user;
    let account     = yield Account.findOne({ user: user._id }).exec();

    // Super Admin
    if (!account || (account.multi_branches)) {
        query = {};

    // Can VIEW ALL
    } else if (canViewAll) {
      if(account.access_branches.length) {
        query = {
          "branch": {
            $in: account.access_branches.slice()
          }
        }

      } else if(account.default_branch) {

          query = {
            "branch": account.default_branch
          }
      }
    
  } else if(canView) {
    query.created_by = user._id;  

    // DEFAULT
    } else {

      query = {
        "created_by": user._id
      }
    }

    let groupLoans = yield GroupLoanDal.getOngoingLoans(query, opts);

    let Compressor = new COMPRESSOR();
    let compressedResult = yield Compressor.compressToGzip(groupLoans);

    
    this.body = compressedResult;
    this.set("Content-Type", "application/json; charset=utf-8");
    this.set("Content-Encoding", "gzip");


    //this.body = groupScreenings;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_LOANS_VIEW_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};

/**
 * Submit group loans
 *
 * @desc Fetch a group with the given id from the database
 *       and update their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.submit = function* submitGroupLoans(next) {
  debug(`submit group Loans: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_LOAN_UPDATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    _id: this.params.id
  };
  let body = this.request.body;

  try {

    let group = yield Group.findOne(query).exec();
    if (!group) {
      throw new Error('Group Does Not Exist')
    }

    let groupLoan = yield GroupLoanDal.get({
      group: group._id
    });
    if (!groupLoan.loans.length) {
      throw new Error("No Loan Applications Present!")
    }

    // let hasNew = false;
    // let affectedClients = [];
    // for(let loan of groupLoan.loans) {
    //   if (loan.status === "new") {
    //     hasNew = true;
    //     affectedClients.push(`${loan.client.first_name} ${loan.client.last_name}`);
    //   }
    // }

    // if (hasNew) {
    //   throw new Error(`${affectedClients.join(",")} loans are new`)
    // }

    let statuses = statusChecker(groupLoan.loans);
    if (!statuses) {
      throw new Error("Loan Statuses are incomplete")
    }

    if (statuses.all_submitted) {
      // task for approver
      let task = yield TaskDal.create({
        task: `${group.name} Group Loans Application Submitted`,
        task_type: 'approve',
        entity_ref: groupLoan._id,
        entity_type: 'group_loan',
        created_by: this.state._user._id,
        user: group.created_by,
        branch: group.branch,
        comment: "None"
      });
      yield NotificationDal.create({
        for: this.state._user._id,
        message: `${group.name} Group Loans Application Submitted Ready For Approval`,
        task_ref: task._id
      }); 
    } else if (statuses.for_review) {
      // task for approver
      let task = yield TaskDal.create({
        task: `${group.name} Group Loans Application Review`,
        task_type: 'review',
        entity_ref: groupLoan._id,
        entity_type: 'group_loan',
        created_by: this.state._user._id,
        user: group.created_by,
        branch: group.branch,
        comment: "None"
      });
      yield NotificationDal.create({
        for: this.state._user._id,
        message: `${group.name} Group Loans Application Submitted Review`,
        task_ref: task._id
      });
    }

    groupLoan = yield GroupLoanDal.update({
      _id: groupLoan._id
    },{
      status: statuses.group_loan
    });

    yield GroupDal.update({ _id: group._id },{
      status: statuses.group
    })

    yield LogDal.track({
      event: 'group_loan_submit',
      group: this.state._user._id,
      message: `Submit Loans for ${groupLoan._id}`,
      diff: body
    });

    this.body = groupLoan;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_LOANS_SUBMIT_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Approve group loans
 *
 * @desc Fetch a group with the given id from the database
 *       and update their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.approve = function* approveGroupLoans(next) {
  debug(`approve group Loans: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_APPROVE_UPDATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    _id: this.params.id
  };
  

  try {

    let group = yield Group.findOne(query).exec();
    if (!group) {
      throw new Error('Group Does Not Exist')
    } 

    let groupLoan = yield GroupLoanDal.get({
      group: group._id
    });

    if (!groupLoan.loans.length) {
      throw new Error("No Loan Applications Present!")
    }

    /*let notSubmitted = false;
    let affectedClients = [];
    for(let loan of groupLoan.loans) {
      if (loan.status !== "submitted") {
        notSubmitted = true;
        affectedClients.push(`${loan.client.first_name} ${loan.client.last_name}`);
      }
    }

    if (notSubmitted) {
      throw new Error(`${affectedClients.join(",")} loans are not submitted`)
    }*/

    let statuses = statusChecker(groupLoan.loans);
    if (!statuses) {
      throw new Error("Loan Statuses are incomplete")
    }

    groupLoan = yield GroupLoanDal.update({
      _id: groupLoan._id
    },{
      status: statuses.group_loan
    });

    yield GroupDal.update({ _id: group._id },{
      status: statuses.group
    })

    yield LogDal.track({
      event: 'group_loan_approve',
      group: this.state._user._id,
      message: `Approve Loans for ${groupLoan._id}`
      
    });

    this.body = groupLoan;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_LOANS_APPROVE_ERROR',
      message: ex.message
    }));

  }

};


/**
 * Update group loan status
 *
 * @desc Update the status of group loan
 *       based on the statuses of the individual loan applications
 *
 * @param {Function} next Middleware dispatcher
 */
exports.updateStatus = function* updateGroupLoanStatus(next) {
  debug(`Update group Loan status: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_LOAN_STATUS_UPDATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    _id: this.params.id
  };
  let body = this.request.body;

  try {

    let group = yield Group.findOne(query).exec();
    if (!group) {
      throw new Error('Group Does Not Exist')
    }

    let groupLoan = yield GroupLoanDal.get({
      group: group._id
    });

    if (!groupLoan.loans.length) {
      throw new Error("No Loan Applications Present!")
    }
    

    let statuses = statusChecker(groupLoan.loans);
    if (!statuses) {
      throw new Error("Loan Statuses are incomplete")
    }

    groupLoan = yield GroupLoanDal.update({
      _id: groupLoan._id
    },{
      status: statuses.group_loan
    });

    yield GroupDal.update({ _id: group._id },{
      status: statuses.group
    })

    yield LogDal.track({
      event: 'group_loan_status_update',
      group: this.state._user._id,
      message: `Update Status of Screenings for  ${groupLoan._id}`,
      diff: body
    });

    this.body = groupLoan;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_LOANS_UPDATE_STATUS_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Get a collection of group loans by Pagination
 *
 * @desc Fetch a collection of loans
 *
 * @param {Function} next Middleware dispatcher
 */
exports.groupLoans = function* fetchGroupLoans(next) {
  debug('get a collection of group loans by pagination');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;

  let sortType = this.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };

  try {
    

    let loans = yield LoanDal.getCollectionByPagination(query, opts);

    this.body = loans;
    
  } catch(ex) {
    return this.throw(new CustomError({
      type: 'VIEW_SCREENINGS_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};


// Utilities
function statusChecker(loans) {
  let statuses = [];

  loans.forEach((loan) =>{
    statuses.push(loan.status)
  });

  //Case 1: The group loan appplications are just created and are all new
  if (containsOnly(statuses, ["new"])) {
    return {
      group: "loan_application_inprogress",
      group_loan: "new"
    };
  }

   //Case 2: The submitter has submitted all loan applications 
   if (containsOnly(statuses, ["submitted"])) {
    return {
      group: "loan_application_submitted",
      group_loan: "submitted",
      all_submitted: true
    };
  }

  //Case 3: The approver accepts all loan applications
  if (containsOnly(statuses, ["accepted"])) {
    return {
      group: "loan_application_accepted",
      group_loan: "accepted"
    };
  }

  //Case 4: The approver rejects one of the loan applications 
            //and all others are processed (not new, submitted or in progress)
  if (statuses.includes("rejected") &&
      (!(statuses.includes("new") || 
        statuses.includes("submitted") ||
        (statuses.includes("inprogress")))
)) {
    return {
      group: "loan_application_rejected",
      group_loan: "rejected"
    };
  }

  
  //Case 5: The approver declines one of the loan applications for review 
            //and all others are processed (not new, submitted or in progress)
  if (statuses.includes("declined_under_review") &&
      (!(statuses.includes("new") || 
        statuses.includes("submitted") ||
        (statuses.includes("inprogress")))
  )) {
    return {
      group: "loan_application_inprogress",
      group_loan: "declined_under_review",
      for_review: true
    };
  }

  return {
    group: "loan_application_inprogress",
    group_loan: "inprogress"
  };
  
}

// function containsOnly(orig, against){
//   return against.every(item => orig.includes(item))
// }

function containsOnly(orig, against){
  const filterAgainst = against.filter (item => !orig.includes(item));  
  const filterOrig = orig.filter(item => !against.includes(item));

  return !(filterAgainst.length + filterOrig.length);
}

function validateCycle(body) {
  return co(function*(){
    debug("Validating group loan cycle")
    // Validate Screenings
    let screenings = yield Screening.find({ client: body.client })
      .sort({ date_created: -1 })
      .exec();
    if(!screenings.length) {
      throw new Error('Client Has Not Screening Application Yet!');
    }

    for(let screening of screenings) {
      if(screening.status === "new" || screening.status === "screening_inprogress" || screening.status === "submitted") {
        throw new Error('Client Has A Screening in progress!!')
      }
    }

    // Validate Loans
    let loans = yield Loan.find({ client: body.client })
      .sort({ date_created: -1 })
      .exec();

    for(let loan of loans) {
      if(loan.status === 'new' || loan.status === 'submitted' || loan.status === "inprogress") {
        throw new Error('Client Has A Loan in progress!!')
      }
    }

    // Validate acats
    let clientACATS = yield ClientACAT.find({ client: body.client })
      .sort({ date_created: -1 })
      .exec();

    for(let acat of clientACATS) {
      if(acat.status === 'new' || acat.status === 'submitted' || acat.status === 'resubmitted' || acat.status === "inprogress") {
        throw new Error('Client Has An ACAT in progress!!')
      }
    }

    let loan = yield Loan.findOne({ client: body.client })
      .sort({ date_created: -1 })
      .exec();

    return loan;
    
  })
}

function createQuestion(question) {
  return co(function* () {
    if(question) {
      question = yield Question.findOne({ _id: question }).exec();
      if(!question) return;

      question = question.toJSON();
    }


    let subs = [];
    delete question._id;

    if(question.sub_questions.length) {
      for(let sub of question.sub_questions) {
        delete sub._id;
        let ans = yield createQuestion(sub);

        if(ans) {
          subs.push(ans._id);
        }
      }

      question.sub_questions = subs;
    }

    let prerequisites = question.prerequisites.slice();

    question.prerequisites = [];

    question = yield QuestionDal.create(question);

    PREQS.push({
      _id: question._id,
      question_text: question.question_text,
      prerequisites: prerequisites
    });



    return question;

  })
}


function createPrerequisites() {
  return co(function*() {
    if(PREQS.length) {
      for(let question of PREQS) {
        let preqs = [];
        for(let  prerequisite of question.prerequisites) {
          let preq = yield Question.findOne({ _id: prerequisite.question }).exec();

          let ques = yield findQuestion(preq.question_text);
          if(ques) {
            preqs.push({
              answer: prerequisite.answer,
              question: ques._id
            })
          }
        }

        yield QuestionDal.update({ _id: question._id }, {
          prerequisites: preqs
        })
      }
    } 
  })
}

function findQuestion(text) {
  return co(function* () {
    let found = null;

    if(PREQS.length) {
      for(let question of PREQS) {

        question = yield Question.findOne({ _id: question._id }).exec();

        if(question.question_text == text) {
          found = question;
          break;
        }
      }
    }

    return found;
  })
}



function validateGroupCycle(body) {
  return co(function*(){
    debug("Validating loan cycle")

    //Validate if the group is new and just created

    // Validate Screenings
    let screenings = yield GroupScreening.find({ group: body.group })
      .sort({ date_created: -1 })
      .exec();

    if(!screenings.length) {
      throw new Error('No screening is created for the group yet and loan application can not be created!');
    }

    for(let screening of screenings) {
      if(screening.status === "new" || screening.status === "screening_inprogress" || screening.status === "submitted") {
        throw new Error('The group is under screening and loan application can not be created')
      }
    }

    // Validate Loans
    let loans = yield GroupLoan.find({ group: body.group })
      .sort({ date_created: -1 })
      .exec();

    for(let loan of loans) {
      if(loan.status === 'new' || loan.status === 'submitted' || loan.status === "inprogress") {
        throw new Error('The group has a loan application in progress!!')
      }
    }

    // Validate acats
    let clientACATS = yield GroupACAT.find({ group: body.group })
      .sort({ date_created: -1 })
      .exec();

    for(let acat of clientACATS) {
      if(acat.status === 'new' || acat.status === 'submitted' || acat.status === 'resubmitted' || acat.status === "inprogress") {
        throw new Error('The group has an ACAT in progress and past the loan application stage!!')
      }
    }

    let loan = yield GroupLoan.findOne({ group: body.group })
      .sort({ date_created: -1 })
      .exec();

    return loan;
    
  })
}