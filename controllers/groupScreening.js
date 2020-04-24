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
const SCREENING           = require ('../lib/screening');

const Group               = require('../models/group');
const GroupScreening      = require('../models/groupScreening');
const GroupLoan           = require('../models/groupLoan');
const GroupACAT           = require('../models/groupACAT');
const GroupHistory        = require ('../models/groupHistory');
const Account             = require('../models/account');

const TokenDal            = require('../dal/token');
const GroupDal            = require('../dal/group');
const GroupScreeningDal   = require('../dal/groupScreening');
const ScreeningDal        = require ('../dal/screening');


const ClientDal           = require('../dal/client');
const LogDal              = require('../dal/log');
const NotificationDal     = require('../dal/notification');
const TaskDal             = require('../dal/task');

const COMPRESSOR         = require('../lib/compress');

let hasPermission         = checkPermissions.isPermitted('GROUP');
let screeningService      = null;
/**
 * Create a group screening 
 *
 * @desc create a group screening to start a new loan cycle.
 *
 * @param {Function} next Middleware dispatcher
 *
 */

exports.createGroupScreening = function* createGroupScreening(next){
  debug('create screening for Group');

  let isPermitted = yield hasPermission(this.state._user, 'CREATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_SCREENING_CREATION_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  

  try{

    //0. Do validations 
    let body = this.request.body;
    if (!body.group){ throw new Error ("Group reference is empty")};
    if (!body.total_amount) {throw new Error ("Total amount is not provided.")}
    let groupId = body.group;
    let group = yield Group.findOne({ _id: groupId }).exec();
    if (!group) {
      throw new Error("Group Does Not Exist!");
    }

    let lastGroupScreening = yield validateGroupCycle({group: body.group});

    let history = yield GroupHistory.findOne({group: body.group}).exec();
    if (!history) {
      throw new Error('Group Has No Loan History');

    } else {
      history = history.toJSON();}
    
    let cycleOk = true;
    let screeningPresent = true;
    let whichCycle = history.cycle_number;
    let missingApplications = [];

    let cycles = history.cycles;
    let currentCycleIndex = cycles.findIndex(cycle => cycle.cycle_number == whichCycle);
    let currentCycle = cycles[currentCycleIndex];
    if (currentCycle){
      if (!currentCycle.acat || !currentCycle.loan || !currentCycle.screening) {
        !currentCycle.screening ? missingApplications.push('Screening') : null;
        !currentCycle.loan ? missingApplications.push('Loan'): null;
        !currentCycle.acat ? missingApplications.push('ACAT'): null;
        cycleOk = false;
        //whichCycle = currentCycle.cycle_number;        
      }
    }

    if (!cycleOk) {
      throw new Error(`Loan Cycle (${whichCycle}) is in progress. Missing ${missingApplications.join(',')} Application(s)`);
    }

    if (!(group.status === "loan_paid")){
      if (group.status === "ACAT-Authorized")
        throw new Error ("Loan is not even granted for the current loan cycle and thus new loan cycle can not be started.")
      else if (group.status === "appraisal_in_progress")
        throw new Error ("Loan appraisal is not completed for the current loan cycle and thus new loan cycle can not be started")
      else if (group.status === "loan_granted" || group.status === "payment_in_progress")
        throw new Error ("The current loan is not paid fully and thus new loan cycle can not be started.")
    }

    //1. Create the group screening
    screeningService = new SCREENING({headers: this.request.header})
    let newGroupScreeningBody = {
      group: body.group,
      created_by: this.state._user._id,
      screenings: []
    }

    let newScreening = {};
    let newScreenings = [];
    for (let screening of lastGroupScreening.screenings){
      let lastScreening = yield ScreeningDal.get({_id: screening});
      newScreening = yield screeningService.createScreening ({
        client: lastScreening.client._id,
        screening: lastScreening._id,
        for_group: true
      });
      
      newScreenings.push (newScreening);

    }

    newGroupScreeningBody.screenings = newScreenings;
    let newGroupScreening = yield GroupScreeningDal.create(newGroupScreeningBody);

    //2. Update the group status and loan cycle number
    yield GroupDal.update ({_id: group._id}, {
      status: "new",
      total_granted_amount: 0,
      total_paid_amount: 0,
      total_amount: body.total_amount,
      loan_cycle_number: group.loan_cycle_number + 1
    });

    //3. Update history to add the new loan cycle
    if (history) {
      let cycleNumber = history.cycle_number + 1;

      yield GroupHistory.findOneAndUpdate({
        _id: history._id
      },{
        $set: {
          cycle_number: cycleNumber,
          last_modified:  moment().toISOString()
        },
        $push: {
          cycles: {
            cycle_number: cycleNumber,
            started_by: this.state._user._id,
            last_edit_by: this.state._user._id,
            screening: newGroupScreening._id,
            total_amount: body.total_amount
          }
        }
      }).exec()
    }

    this.body = newGroupScreening;
    

  } catch(ex) {
    this.throw(new CustomError({
      type: 'GROUP_SCREENING_CREATION_ERROR',
      message: ex.message
    }));
  }
}


/**
 * Get a single group.
 *
 * @desc Fetch a group with the given id from the database.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchOne = function* fetchOneGroupScreening(next) {
  debug(`fetch group screening: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_SCREENING_VIEW_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    group: this.params.id
  };

  try {
    let groupScreening = yield GroupScreeningDal.get(query, "last");

    yield LogDal.track({
      event: 'view_group_screening',
      group: this.state._user._id ,
      message: `View group - ${groupScreening._id}`
    });

    this.body = groupScreening;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_SCREENING_VIEW_ERROR',
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
exports.update = function* updateGroupScreening(next) {
  debug(`updating group Screening: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_SCREENING_UPDATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    _id: this.params.id
  };
  let body = this.request.body;

  try {

    let groupScreening = yield GroupScreeningDal.update(query, body);

    yield LogDal.track({
      event: 'group_screening_update',
      group: this.state._user._id ,
      message: `Update Info for ${groupScreening._id}`,
      diff: body
    });

    this.body = groupScreening;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_UPDATE_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Get a collection of group screenings by Pagination
 *
 * @desc Fetch a collection of group screenings
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchAllByPagination = function* fetchAllGroupScreenings(next) {
  debug('get a collection of group screenings by pagination');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_SCREENINGS_VIEW_COLLECTION_ERROR',
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

    let groups = yield GroupDal.getCollectionByPagination(query, {
      page: opts.page,
      limit: opts.limit * 2,
      sort: sort
    });

    let ids = [];
    for(let doc of groups.docs) {
      ids.push(doc._id)
    }

    let groupScreenings = yield GroupScreeningDal.getCollectionByPagination({
      "group": { $in: ids }
    }, opts);

    this.body = groupScreenings;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_SCREENINGS-_VIEW_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};

/**
 * Get a collection of ongoing group screenings by Pagination
 *
 * @desc Fetch a collection of group screenings
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchOngoingPagination = function* fetchAllGroupScreenings(next) {
  debug('get a collection of group screenings by pagination');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_SCREENINGS_VIEW_COLLECTION_ERROR',
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

    let groupScreenings = yield GroupScreeningDal.getOngoingScreenings (query, opts)

    let Compressor = new COMPRESSOR();
    let compressedResult = yield Compressor.compressToGzip(groupScreenings);

    
    this.body = compressedResult;
    this.set("Content-Type", "application/json; charset=utf-8");
    this.set("Content-Encoding", "gzip");


    //this.body = groupScreenings;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_SCREENINGS-_VIEW_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};

/**
 * Submit group screenings
 *
 * @desc Fetch a group with the given id from the database
 *       and update their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.submit = function* submitGroupScreenings(next) {
  debug(`submit group Screenings: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_SCREENING_UPDATE_ERROR',
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

    let groupScreening = yield GroupScreeningDal.get({
      group: group._id
    });

    // let hasNew = false;
    // let affectedClients = [];
    // for(let screening of groupScreening.screenings) {
    //   if (screening.status === "new") {
    //     hasNew = true;
    //     affectedClients.push(`${screening.client.first_name} ${screening.client.last_name}`);
    //   }
    // }

    // if (hasNew) {
    //   throw new Error(`${affectedClients.join(",")} screenings are new`)
    // }

    let statuses = statusChecker(groupScreening.screenings);
    if (!statuses) {
      throw new Error("Screening Statuses are incomplete")
    }

    if (statuses.all_submitted) {
      // task for approver
      let task = yield TaskDal.create({
        task: `${group.name} Group Screenings Application Submitted`,
        task_type: 'approve',
        entity_ref: groupScreening._id,
        entity_type: 'group_screening',
        created_by: this.state._user._id,
        user: group.created_by,
        branch: group.branch,
        comment: "None"
      });
      yield NotificationDal.create({
        for: this.state._user._id,
        message: `${group.name} Group Screenings Application Submitted Ready For Approval`,
        task_ref: task._id
      }); 
    } else if (statuses.for_review) {
      // task for approver
      let task = yield TaskDal.create({
        task: `${group.name} Group Screenings Application Review`,
        task_type: 'review',
        entity_ref: groupScreening._id,
        entity_type: 'group_screening',
        created_by: this.state._user._id,
        user: group.created_by,
        branch: group.branch,
        comment: "None"
      });
      yield NotificationDal.create({
        for: this.state._user._id,
        message: `${group.name} Group Screenings Application Submitted Review`,
        task_ref: task._id
      });
    }

    groupScreening = yield GroupScreeningDal.update({
      _id: groupScreening._id
    },{
      status: statuses.group_screening
    });

    yield GroupDal.update({ _id: group._id },{
      status: statuses.group
    })

    yield LogDal.track({
      event: 'group_screening_submit',
      group: this.state._user._id,
      message: `Submit Screenings for ${groupScreening._id}`,
      diff: body
    });

    this.body = groupScreening;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_SCREENINGS_SUBMIT_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Approve group screenings
 *
 * @desc Fetch a group with the given id from the database
 *       and update their data
 *
 * @param {Function} next Middleware dispatcher
 */
exports.approve = function* approveGroupScreenings(next) {
  debug(`approve group Screenings: ${this.params.id}`);

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

    let groupScreening = yield GroupScreeningDal.get({
      group: group._id
    });

    /*let notSubmitted = false;
    let affectedClients = [];
    for(let screening of groupScreeni ng.screenings) {
      if (screening.status !== "submitted") {
        notSubmitted = true;
        affectedClients.push(`${screening.client.first_name} ${screening.client.last_name}`);
      }
    }

    if (notSubmitted) {
      throw new Error(`${affectedClients.join(",")} screenings are not submitted`)
    }*/

    let statuses = statusChecker(groupScreening.screenings);
    if (!statuses) {
      throw new Error("Screening Statuses are incomplete")
    }

    groupScreening = yield GroupScreeningDal.update({
      _id: groupScreening._id
    },{
      status: statuses.group_screening
    });

    yield GroupDal.update({ _id: group._id },{
      status: statuses.group
    })

    yield LogDal.track({
      event: 'group_screening_approve',
      group: this.state._user._id,
      message: `Approve Screenings for ${groupScreening._id}`,
      diff: body
    });

    this.body = groupScreening;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_SCREENINGS_APPROVE_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Update group screening status
 *
 * @desc Update the status of group screening
 *       based on the statuses of the individual screenings
 *
 * @param {Function} next Middleware dispatcher
 */
exports.updateStatus = function* updateGroupScreeningStatus(next) {
  debug(`update group Screening status: ${this.params.id}`);

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

    let groupScreening = yield GroupScreeningDal.get({
      group: group._id
    });

    

    let statuses = statusChecker(groupScreening.screenings);
    if (!statuses) {
      throw new Error("Screening Statuses are incomplete")
    }

    groupScreening = yield GroupScreeningDal.update({
      _id: groupScreening._id
    },{
      status: statuses.group_screening
    });

    yield GroupDal.update({ _id: group._id },{
      status: statuses.group
    })

    yield LogDal.track({
      event: 'group_screening_status_update',
      group: this.state._user._id,
      message: `Update Status of Screenings for ${groupScreening._id}`,
      diff: body
    });

    this.body = groupScreening;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_SCREENINGS_UPDATE_STATUS_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Get a collection of group screenings by Pagination
 *
 * @desc Fetch a collection of screenings
 *
 * @param {Function} next Middleware dispatcher
 */
exports.groupScreenings = function* fetchGroupScreenings(next) {
  debug('get a collection of group screenings by pagination');

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
    

    let screenings = yield ScreeningDal.getCollectionByPagination(query, opts);

    this.body = screenings;
    
  } catch(ex) {
    return this.throw(new CustomError({
      type: 'VIEW_SCREENINGS_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};


// Utilities
function statusChecker(screenings) {
  let statuses = [];

  screenings.forEach((screening) =>{
    statuses.push(screening.status)
  });

  //Case 1: The group screenings are just created and are all new
  if (containsOnly(statuses, ["new"])) {
    return {
      group: "screening_in_progress",
      group_screening: "new"
    };
  }

  //Case 2: The submitter has submitted all screenings 
  if (containsOnly(statuses, ["submitted"])) {
    return {
      group: "screening_submitted",
      group_screening: "submitted",
      all_submitted: true
    };
  }

  //Case 3: The approver has approved all screenings 
  if (containsOnly(statuses, ["approved"])) {
    return {
      group: "eligible",
      group_screening: "approved"
    };
  }  
  
  //Case 4: The approver rejects one of the screenings 
            //and all others are processed (not new, submitted or in progress)
  if (statuses.includes("declined_final") &&
        (!(statuses.includes("new") || 
          statuses.includes("submitted") ||
          (statuses.includes("screening_inprogress")))
  )) {
    return {
      group: "ineligible",
      group_screening: "declined_final"
    };
  }

  //Case 5: The approver declines one of the screenings for review 
            //and all others are processed (not new, submitted or in progress)
  if (statuses.includes("declined_under_review") &&
        (!(statuses.includes("new") || 
          statuses.includes("submitted") ||
          (statuses.includes("screening_inprogress")))
  )) {
    return {
      group: "screening_in_progress",
      group_screening: "declined_under_review",
      for_review: true
    };
  }

  //Case 6 : All other cases
  return {
    group: "screening_in_progress",
    group_screening: "screening_inprogress"
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

        // Validate Screenings
    let screenings = yield GroupScreening.find({ group: body.group })
      .sort({ date_created: -1 })
      .exec();

    for(let screening of screenings) {
      if(screening.status === "new" || screening.status === "screening_inprogress" || screening.status === "submitted") {
        throw new Error('The group has a screening in progress and thus has an incomplete loan cycle.')
      }
    }

    // Validate Loans
    let loans = yield GroupLoan.find({ group: body.group })
      .sort({ date_created: -1 })
      .exec();

    for(let loan of loans) {
      if(loan.status === 'new' || loan.status === 'submitted' || loan.status === "inprogress") {
        throw new Error('The group has a loan application in progress and thus has an incomplete loan cycle.')
      }
    }

    // Validate acats
    let clientACATS = yield GroupACAT.find({ group: body.group })
      .sort({ date_created: -1 })
      .exec();

    for(let acat of clientACATS) {
      if(acat.status === 'new' || acat.status === 'submitted' || acat.status === 'resubmitted' || acat.status === "inprogress") {
        throw new Error('The group has an ACAT in progress and thus has an incomplete loan cycle.')
      }
    }

    let screening = yield GroupScreening.findOne({ group: body.group })
      .sort({ date_created: -1 })
      .exec();

    return screening;
    
  })
}

