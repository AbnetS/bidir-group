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
const ACAT                = require ('../lib/acat');


const Group               = require('../models/group');
const GroupScreening      = require('../models/groupScreening');
const GroupLoan           = require('../models/groupLoan');
const GroupACAT           = require('../models/groupACAT');
const GroupHistory           = require('../models/groupHistory');
const Account             = require('../models/account');

const TokenDal            = require('../dal/token');
const GroupDal            = require('../dal/group');
const GroupACATDal   = require('../dal/groupACAT');
const ClientDal           = require('../dal/client');
const LogDal              = require('../dal/log');
const NotificationDal    = require('../dal/notification');
const TaskDal            = require('../dal/task');
const ClientACATDal            = require('../dal/clientACAT');

const COMPRESSOR         = require('../lib/compress');

let hasPermission         = checkPermissions.isPermitted('GROUP');

let ACATService = null;

/**
 * Initialize Member ACAT 
 *
 * @desc Initialize ACAT for a member of a group and update group ACAT.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.initializeMemberACAT = function* initializeMemberACAT(next){
  debug ("Initialize member ACAT and update group ACAT");

  let isPermitted = yield hasPermission(this.state._user, 'CREATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_MEMBER_ACAT_INITIALIZE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }


  try{
    let groupId = this.params.groupId;
    let group = yield Group.findOne({_id: groupId}).exec();
    if (!group){
      throw new Error ("Group does not exist");
    }

    let history = yield GroupHistory.findOne({group: groupId}).exec();
    if (!history) {
      throw new Error('Group Has No Loan History');

    } else {
      history = history.toJSON();}

    let whichCycle = history.cycle_number;   
    let cycles = history.cycles;
    let currentCycleIndex = cycles.findIndex(cycle => cycle.cycle_number == whichCycle);

    let groupACAT = yield GroupACAT.findOne({_id: cycles[currentCycleIndex].acat})                            
                            .exec(); 
    if (!groupACAT){
      throw new Error ("Group ACAT is not yet created.")
    }
    

    //1. Initialize Client ACAT for the given member
    let clientACATBody = this.request.body;
    ACATService = new ACAT ({headers: this.request.header});

    let clientACAT = yield ACATService.initializeClientACAT (clientACATBody);
    //Update the client ACAT for_group attribute
    clientACAT = yield ClientACATDal.update ({_id: clientACAT._id},
                    {for_group: true})
    yield LogDal.track({
      event: 'initialize_member_acat',
      group: this.state._user._id ,
      message: `Initialize For - ${clientACATBody.client}`
    });


    //2. Add the newly created client ACAT into the group ACAT    
    let acats = groupACAT.acats;
    acats.push(clientACAT._id); 
    let updatedGroupACAT = yield GroupACATDal.update ({_id: groupACAT._id},
                              {acats: acats, status: "inprogress"});
    yield LogDal.track({
      event: 'update_group_acat',
      group: this.state._user._id ,
      message: `Update group acat - ${groupACAT._id}`
    });
                         
   

    //3. Update the status of Group to "ACAT_IN_PROGRESS"
    let updatedGroup = yield GroupDal.update ({_id: groupId}, {status: "ACAT_IN_PROGRESS" })
    yield LogDal.track({
      event: 'update_group',
      group: this.state._user._id ,
      message: `Update group - ${groupId}`
    });
    

    //4. Return the Client ACAT
    this.body = clientACAT;

  } catch (ex){
    let message = "";
    if (ex.message.includes ("Client Has An ACAT in progress")){
      message = "The member has an A-CAT which is in progress."
    }
    else if (ex.message.includes ('Client Has Not Screening Form Yet!')){
      message = "The member has no screening yet and A-CAT processing can not be started."
    }
    else if (ex.message.includes ("Client Has A Screening in progress!!")){
      message = "The member has a screening in progress and A-CAT processing can not be started."
    }
    else if (ex.message.includes("Client Has A Loan in progress!!")){
      message = "The member has a loan application in progress and A-CAT processing can not be started."
    }
    else if (ex.message.includes ("Client Has An ACAT in progress!!")){
      message = "The member has an A-CAT application which is in progress."
    }


    else
      message = ex.message;
    
    return this.throw (new CustomError ({
      type: 'GROUP_MEMBER_ACAT_INITIALIZE_ERROR',
      message: message
    }));

  }
}

/**
 * Create a group acat.
 *
 * @desc Fetch a group with the given id from the database.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.create = function* createGroupACAT(next) {
  debug(`create group acat`);

  let isPermitted = yield hasPermission(this.state._user, 'CREATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_ACAT_CREATION_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }


  let body = this.request.body;

  this.checkBody('group')
      .notEmpty('Group Reference is Empty');

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'GROUP_ACAT_CREATION_ERROR',
      message: JSON.stringify(this.errors)
    }));
  }

  try {
    
    //0. Do validations
    let group = yield GroupDal.get({ _id: body.group });
    if (!group) {
      throw new Error("Group Does Not Exist!")
    }

    if (group.status === "new"){
      throw new Error ("The group is in pre-screening stage. Thus A-CAT evalaution can not be started.");
    }

    let acat = yield validateGroupCycle ({group: body.group});

    let history = yield GroupHistory.findOne({group: body.group}).exec();
    if (!history) {
      throw new Error('Group Has No Loan History');

    } else {
      history = history.toJSON();}

    let cycleOk = true;
    let acatPresent = true;
    let whichCycle = history.cycle_number;
    let missingApplications = [];

    let cycles = history.cycles;
    let currentCycleIndex = cycles.findIndex(cycle => cycle.cycle_number == whichCycle);
    let currentCycle = cycles[currentCycleIndex];
    if (currentCycle){
      if (!currentCycle.screening || !currentCycle.loan) {
        !currentCycle.screening ? missingApplications.push('Screening') : null;
        !currentCycle.loan ? missingApplications.push('Loan') : null;
        cycleOk = false;       
      } else if (currentCycle.acat) {
        acatPresent = false;        
      }
    }

    if (!cycleOk) {
      throw new Error(`Loan Cycle (${whichCycle}) is in progress. Missing ${missingApplications.join(', ')} Application(s)`);
    }

    if (!acatPresent) {
      throw new Error(`Loan Cycle (${whichCycle}) is in progress.`);
    }

    //1. Create Group ACAT
    body.created_by = this.state._user._id;
    let groupACAT = yield GroupACATDal.create(body);
    let groupUpdated = yield GroupDal.update({ _id: body.group },{"status":"ACAT_New"});

    //2. Update the history of the current loan cycle
    cycles[currentCycleIndex].acat = groupACAT._id;
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

    this.body = groupACAT;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_ACAT_VIEW_ERROR',
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
exports.fetchOne = function* fetchOneGroupACAT(next) {
  debug(`fetch group acat: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_ACAT_VIEW_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    group: this.params.id
  };

  try {
    let groupACAT = yield GroupACATDal.get(query, "last");

    yield LogDal.track({
      event: 'view_group_acat',
      group: this.state._user._id ,
      message: `View group - ${groupACAT._id}`
    });

    this.body = groupACAT;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_ACAT_VIEW_ERROR',
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
exports.update = function* updateGroupACAT(next) {
  debug(`updating group ACAT: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_ACAT_UPDATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    _id: this.params.id
  };
  let body = this.request.body;

  try {

    let groupACAT = yield GroupACATDal.update(query, body);

    yield LogDal.track({
      event: 'group_acat_update',
      group: this.state._user._id ,
      message: `Update Info for ${groupACAT._id}`,
      diff: body
    });

    this.body = groupACAT;

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
exports.fetchAllByPagination = function* fetchAllGroupACATs(next) {
  debug('get a collection of group acats by pagination');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_ACATS_VIEW_COLLECTION_ERROR',
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

    let groupACATs = yield GroupACATDal.getCollectionByPagination({group: { $in: ids }},opts);
 
    this.body = groupACATs;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_ACATS-_VIEW_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};


exports.fetchOngoingPagination = function* fetchOngoingGroupAcats(next) {
  debug('get a collection of ongoing group ACATs by pagination');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_ACATS_VIEW_COLLECTION_ERROR',
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

    let groupACATs = yield GroupACATDal.getOngoingACAT(query, opts);

    let Compressor = new COMPRESSOR();
    let compressedResult = yield Compressor.compressToGzip(groupACATs);

    
    this.body = compressedResult;
    this.set("Content-Type", "application/json; charset=utf-8");
    this.set("Content-Encoding", "gzip");
    

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_ACATS_VIEW_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};

/**
 * Submit group acats
 *
 * @desc Fetch a group with the given id from the database
 *       and update their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.submit = function* submitGroupACATs(next) {
  debug(`submit group ACATs: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_ACAT_UPDATE_ERROR',
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

    let groupACAT = yield GroupACATDal.get({
      group: group._id
    });
    if (!groupACAT.acats.length) {
      throw new Error("No ACATs Applications Present!")
    }

    // let hasNew = false;
    // let affectedClients = [];
    // for(let acat of groupACAT.acats) {
    //   if (acat.status === "new") {
    //     hasNew = true;
    //     affectedClients.push(`${acat.client.first_name} ${acat.client.last_name}`);
    //   }
    // }

    // if (hasNew) {
    //   throw new Error(`${affectedClients.join(",")} acats are new`)
    // }

    let statuses = statusChecker(groupACAT.acats);
    if (!statuses) {
      throw new Error("ACAT Statuses are incomplete")
    }

    if (statuses.all_submitted) {
      // task for approver
      let task = yield TaskDal.create({
        task: `${group.name} Group ACATs Application Submitted`,
        task_type: 'approve',
        entity_ref: groupACAT._id,
        entity_type: 'group_acat',
        created_by: this.state._user._id,
        user: group.created_by,
        branch: group.branch,
        comment: "None"
      });
      yield NotificationDal.create({
        for: this.state._user._id,
        message: `${group.name} Group ACATs Application Submitted Ready For Approval`,
        task_ref: task._id
      }); 
    } else if (statuses.for_review) {
      // task for approver
      let task = yield TaskDal.create({
        task: `${group.name} Group ACATs Application Review`,
        task_type: 'review',
        entity_ref: groupACAT._id,
        entity_type: 'group_acat',
        created_by: this.state._user._id,
        user: group.created_by,
        branch: group.branch,
        comment: "None"
      });
      yield NotificationDal.create({
        for: this.state._user._id,
        message: `${group.name} Group ACATs Application Submitted Review`,
        task_ref: task._id
      });
    }

    groupACAT = yield GroupACATDal.update({
      _id: groupACAT._id
    },{
      status: statuses.group_acat
    });

    yield GroupDal.update({ _id: group._id },{
      status: statuses.group
    })

    yield LogDal.track({
      event: 'group_acat_submit',
      group: this.state._user._id,
      message: `Submit ACATs for ${groupACAT._id}`,
      diff: body
    });

    this.body = groupACAT;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_ACATS_SUBMIT_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Approve group acats
 *
 * @desc Fetch a group with the given id from the database
 *       and update their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.approve = function* approveGroupACATs(next) {
  debug(`approve group ACATs: ${this.params.id}`);

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
  let body = this.request.body;

  try {

    let group = yield Group.findOne(query).exec();
    if (!group) {
      throw new Error('Group Does Not Exist')
    }

    let groupACAT = yield GroupACATDal.get({
      group: group._id
    });
    if (!groupACAT.acats.length) {
      throw new Error("No ACATs Applications Present!")
    }

    /*let notSubmitted = false;
    let affectedClients = [];
    for(let acat of groupACAT.acats) {
      if (acat.status !== "submitted") {
        notSubmitted = true;
        affectedClients.push(`${acat.client.first_name} ${acat.client.last_name}`);
      }
    }

    if (notSubmitted) {
      throw new Error(`${affectedClients.join(",")} acats are not submitted`)
    }*/

    let statuses = statusChecker(groupACAT.acats);
    if (!statuses) {
      throw new Error("ACAT Statuses are incomplete")
    }

    groupACAT = yield GroupACATDal.update({
      _id: groupACAT._id
    },{
      status: statuses.group_acat
    });

    yield GroupDal.update({ _id: group._id },{
      status: statuses.group
    })

    yield LogDal.track({
      event: 'group_acat_approve',
      group: this.state._user._id,
      message: `Approve ACATs for ${groupACAT._id}`,
      diff: body
    });

    this.body = groupACAT;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_ACATS_APPROVE_ERROR',
      message: ex.message
    }));

  }

};

exports.updateStatus = function* updateGroupACATStatus(next) {
  debug(`Update group ACATs: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_ACAT_STATUS_UPDATE_ERROR',
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

    let groupACAT = yield GroupACATDal.get({
      group: group._id
    });
    if (!groupACAT.acats.length) {
      throw new Error("No ACATs Applications Present!")
    }

    let statuses = statusChecker(groupACAT.acats);
    if (!statuses) {
      throw new Error("ACAT Statuses are incomplete")
    }

    groupACAT = yield GroupACATDal.update({
      _id: groupACAT._id
    },{
      status: statuses.group_acat
    });

    yield GroupDal.update({ _id: group._id },{
      status: statuses.group
    })

    yield LogDal.track({
      event: 'group_acat_update_status',
      group: this.state._user._id,
      message: `Update ACATs for ${groupACAT._id}`,
      diff: body
    });

    this.body = groupACAT;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_ACAT_UPDATE_STATUS_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Get a collection of group acats by Pagination
 *
 * @desc Fetch a collection of acats
 *
 * @param {Function} next Middleware dispatcher
 */
exports.groupACATs = function* fetchGroupACATs(next) {
  debug('get a collection of group acats by pagination');

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
    

    let acats = yield ACATDal.getCollectionByPagination(query, opts);

    this.body = acats;
    
  } catch(ex) {
    return this.throw(new CustomError({
      type: 'VIEW_SCREENINGS_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};


// Utilities
function statusChecker(acats) {
  let statuses = [];

  acats.forEach((acat) =>{
    statuses.push(acat.status)
  });

  //Case 1: The acat appplications are just created and are all new
  if (containsOnly(statuses, ["new"])) {
    return {
      group: "ACAT_IN_PROGRESS",
      group_acat: "new"
    };
  }

 //Case 2: The submitter has submitted all loan ACAT applications 
 if (containsOnly(statuses, ["submitted"])) {
  return {
    group: "ACAT-submitted",
    group_acat: "submitted",
    all_submitted:  true
  };
}

//Case 3: The approver authorizes all ACAT applications
if (containsOnly(statuses, ["authorized"])) {
  return {
    group: "ACAT-Authorized",
    group_acat: "authorized"
  };
}

//Case 4: The approver declines one of the ACAT applications 
            //and all others are processed (not new, submitted, resubmitted or in progress)
if (statuses.includes("declined_for_review") &&
    (!(statuses.includes("new") || 
      statuses.includes("submitted") ||
      statuses.includes("resubmitted") ||
      (statuses.includes("inprogress")))
)) {
  return {
    group: "ACAT_Declined_For_Review",
    group_acat: "declined_for_review"
  };
}

//Case 5: The approver resubmits one of the ACAT applications 
            //and all others are processed (not new, declined for review or in progress)
if (statuses.includes("resubmitted") &&
      (!(statuses.includes("new") ||         
        statuses.includes("declined_for_review") ||
        (statuses.includes("inprogress")))
)) {
  return {
    group: "ACAT-Resubmitted",
    group_acat: "resubmitted"
};
}


return {
  group: "ACAT_IN_PROGRESS",
  group_acat: "inprogress"
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

function validateGroupCycle(body) {
  return co(function*(){
    debug("Validating loan cycle")

    //Validate if the group is new and just created

    // Validate Screenings
    let screenings = yield GroupScreening.find({ group: body.group })
      .sort({ date_created: -1 })
      .exec();

    if(!screenings.length) {
      throw new Error('No screening is created for the group yet and A-CAT processing can not be started!');
    }

    for(let screening of screenings) {
      if(screening.status === "new" || screening.status === "screening_inprogress" || screening.status === "submitted") {
        throw new Error('The group is under screening and A-CAT processing can not be started.')
      }
    }

    // Validate Loans
    let loans = yield GroupLoan.find({ group: body.group })
      .sort({ date_created: -1 })
      .exec();

    for(let loan of loans) {
      if(loan.status === 'new' || loan.status === 'submitted' || loan.status === "inprogress") {
        throw new Error('Loan application stage is not completed for the group and A-CAT processing can not be started.')
      }
    }

    //Make sure the immediate preceeding group loan is accepted (not rejected)
    let loan = yield GroupLoan.findOne({ group: body.group })
        .sort({ date_created: -1 })
        .exec();
    if (loan.status === 'rejected'){
      throw new Error ("The group loan application is rejected and A-CAT processing can not started.")
    }

    //Validate acats
    let clientACATS = yield GroupACAT.find({ group: body.group })
      .sort({ date_created: -1 })
      .exec();

    for(let acat of clientACATS) {
      if(acat.status === 'new' || acat.status === 'submitted' || acat.status === 'resubmitted' || acat.status === "inprogress") {
        throw new Error('The group has already an A-CAT application in progress.')
      }
    }

    let acat = yield GroupACAT.findOne({ group: body.group })
      .sort({ date_created: -1 })
      .exec();

    return acat;
    
  })
}