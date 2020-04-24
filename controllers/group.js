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

const Group               = require('../models/group');
const GroupScreening      = require('../models/groupScreening');
const Screening           = require('../models/screening');
const Account             = require('../models/account');
const LoanProposal        = require ('../models/loanProposal');
const GroupHistory        = require ('../models/groupHistory');

const TokenDal            = require('../dal/token');
const GroupDal            = require('../dal/group');
const GroupScreeningDal   = require('../dal/groupScreening');
const ClientDal           = require('../dal/client');
const ScreeningDal           = require('../dal/screening');
const LogDal              = require('../dal/log');
const LoanProposalDal     = require ('../dal/loanProposal');
const groupHistoryDal     = require ('../dal/groupHistory');
const XLSX_GENERATOR      = require ('../lib/xlsx-generator');//CLASS

let hasPermission = checkPermissions.isPermitted('GROUP');

/**
 * Create a group.
 *
 * @desc create a group using basic Authentication or Social Media
 *
 * @param {Function} next Middleware dispatcher
 *
 */
exports.create = function* createGroup(next) {
  debug('create group');

  let isPermitted = yield hasPermission(this.state._user, 'CREATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_CREATION_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }


  let body = this.request.body;

  this.checkBody('name')
      .notEmpty('Group Name is Empty.');
  this.checkBody('branch')
      .notEmpty('Branch is Empty.');
  this.checkBody('no_of_members')
      .notEmpty('Number of members is not specified.');
  this.checkBody('total_amount')
      .notEmpty('Total amount is not specified.');
  

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'GROUP_CREATION_ERROR',
      message: JSON.stringify(this.errors)
    }));
  }

  try {

    if (body.members) {
      throw new Error('Use PUT /groups/:id/members to add members')
    }

    // Create Group Type
    body.created_by = this.state._user._id;
    body.loan_cycle_number = 1;

    let group = yield GroupDal.create(body);

    // Add Group Screening
    let groupScreening = yield GroupScreeningDal.create({
      group: group._id,
      created_by: this.state._user._id
    });

    //Create History record (start history tracking)
    yield groupHistoryDal.create({
      group: group._id,
      cycles: [{
        started_by: this.state._user._id,
        last_edit_by: this.state._user._id,
        screening: groupScreening._id,
        total_amount: body.total_amount,
        cycle_number: 1
      }],
      branch: group.branch._id,
      cycle_number: 1
    })


    this.body = group;

  } catch(ex) {
    this.throw(new CustomError({
      type: 'GROUP_CREATION_ERROR',
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
exports.fetchOne = function* fetchOneGroup(next) {
  debug(`fetch group: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_VIEW_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    _id: this.params.id
  };

  try {
    let group = yield GroupDal.get(query);
    if (!group){
      throw new Error ("Group does not exist");
    }

    yield LogDal.track({
      event: 'view_group',
      group: this.state._user._id ,
      message: `View group - ${group.name}`
    });

    this.body = group;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_VIEW_ERROR',
      message: ex.message
    }));
  }

};

/**
 * Update Group Members
 *
 * @desc Fetch a group with the given ID and update their respective members.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.addMembers = function* addMembers(next) {
  debug(`updating group members: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_UPDATE_MEMBERS_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    _id: this.params.id
  };

  let body = this.request.body;

  this.checkBody('members')
      .notEmpty('Group Members Reference is Empty');

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'GROUP_UPDATE_MEMBERS_ERROR',
      message: JSON.stringify(this.errors)
    }));

  } else if (!Array.isArray(body.members)) {
    let typeMembers = typeof body.members;

    return this.throw(new CustomError({
      type: 'GROUP_UPDATE_MEMBERS_ERROR',
      message: "Expected List Of Members but Got " + typeMembers
    }));

  }

  try {
    let group = yield Group.findOne(query).exec();
    if (!group) {
      throw new Error('Group Not Found')
    }

    if (group.no_of_members === group.members.length) {
      throw new Error("Number of Members Exceeded!")
    }

    group = group.toJSON();
    let members = group.members.slice().map(function toString(member){
      return member.toString()
    })

    // Reset screening group status incase member removed
    for(let member of members) {
      let screenings = yield Screening.find({ client: member })
        .sort({ date_created: -1 }).exec();

      // Only the latest
      if (screenings.length) {
         yield ScreeningDal.update({ _id: screenings[0]._id },{
          for_group: false
        });
      }
     
    }

    //@TODO merging strings and objectIds
    members = _.uniq(_.concat(members, body.members))

    // Upsert Members Screenings
    // @TODO add screening/groupScreening model
    let memberScreenings = [];
    let groupScreening = yield GroupScreening.findOne({ group: group._id }).exec();
    for(let member of members) {
      //Update member for_group attribute
      ClientDal.update({_id: member}, {for_group: true});

      let screenings = yield Screening.find({ client: member })
        .sort({ date_created: -1 }).exec();

        if (screenings.length) {
          let screening = screenings[0];

          yield ScreeningDal.update({ _id: screening._id },{
            for_group: true
          });

          memberScreenings.push(screening._id.toString());
        }
    }
    let groupScreenings = groupScreening.screenings.map(function(screening){
      return screening.toString();
    });
    memberScreenings = _.uniq(_.concat(groupScreenings, memberScreenings))

    yield GroupScreeningDal.update({ _id: groupScreening._id},{
      screenings: memberScreenings
    })

    // Update Group
    group = yield GroupDal.update({ _id: group._id},{
      members: members
    })

    yield LogDal.track({
      event: 'group_update_members',
      group: this.state._user._id ,
      message: `Update Members for ${group.name}`,
      diff: body
    });

    this.body = group;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_UPDATE_MEMBERS_ERROR',
      message: ex.message
    }));

  }

};

/**
 * Update Group Leader
 *
 * @desc Fetch a group with the given ID and update their respective leader.
 *
 * @param {Function} next Middleware dispatcher
 */
exports.addLeader = function* addLeader(next) {
  debug(`updating status group: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_UPDATE_LEADER_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    _id: this.params.id
  };

  let body = this.request.body;

  this.checkBody('leader')
      .notEmpty('Group Leader Reference is Empty');

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'GROUP_UPDATE_LEADER_ERROR',
      message: JSON.stringify(this.errors)
    }));
  }

  try {
    let group = yield Group.findOne(query);
    if (!group) {
      throw new Error('Group Not Found')
    }
    

    let isMember = group.members.some((member)=>{
      return member.toString() == body.leader
    })

    if (!isMember) {
      throw new Error("Selected Leader is Not a Member of this group")
    }

    group = yield GroupDal.update({ _id: group._id},{
      leader: body.leader
    })

    yield LogDal.track({
      event: 'group_update_leader',
      group: this.state._user._id,
      message: `Update Leader for ${group.name}`,
      diff: body
    });

    this.body = group;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_UPDATE_LEADER_ERROR',
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
exports.update = function* updateGroup(next) {
  debug(`updating group: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_UPDATE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    _id: this.params.id
  };
  let body = this.request.body;

  try {
    if (body.members || body.leader) {
      throw new Error("Use Corresponding endpoints for updating group members or leader")
    }

    let group = yield GroupDal.update(query, body);

    yield LogDal.track({
      event: 'group_update',
      group: this.state._user._id ,
      message: `Update Info for ${group.title}`,
      diff: body
    });

    this.body = group;

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
exports.fetchAllByPagination = function* fetchAllGroups(next) {
  debug('get a collection of groups by pagination');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_VIEW_COLLECTION_ERROR',
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
    let groups;

    // Super Admin
    if (!account || (account.multi_branches)) {
        query = {};

    // Can VIEW ALL
    } else if (canViewAll) {
      if(account.access_branches.length) {
        query = {
          branch: { $in: account.access_branches }
        }

      } else if(account.default_branch) {
          query = {
            branch: account.default_branch
          }
      }

    // DEFAULT
   // Can VIEW
  } else if(canView) {
    query.created_by = user._id;   
  // DEFAULT
  } else {
    query.created_by = user._id;    
  }

    groups = yield GroupDal.getCollectionByPagination(query, opts);

    this.body = groups;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_VIEW_COLLECTION_ERROR',
      message: ex.message
    }));
  }
};

exports.updateStatus = function* updateGroupStatus (next){
  debug(`update group  status: ${this.params.groupId}`);

  let isPermitted = yield hasPermission(this.state._user, 'UPDATE');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'GROUP_UPDATE_STATUS_ERROR',
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

    let updatedGroup = group;

    if (this.request.body.status){
      let status = this.request.body.status;
      if (!(status === "loan_paid")){
        throw new Error ('Allowed values for status is only loan_paid');
      }

      if (group.status === "ACAT-Authorized"){
        throw new Error ("Loan is not yet granted to all or some of the members.")
      }

      if (group.status ===  "loan_paid"){
        throw new Error ('All members of this group paid their loans, and status can not be modified');
      }
      
      if (!(group.status === "loan_granted" || group.status === "payment_in_progress" || group.status === "loan_paid")){
        throw new Error ('The group loan appraisal process is not yet completed.')
      }      

      //Update the group (set status and make the total_loan_paid equal to total_loan_granted)
      updatedGroup = yield GroupDal.update({_id: group._id},
                        {status: status, total_paid_amount: group.total_granted_amount});
      
      //Update each member of the group
      for (let member of group.members){
        yield ClientDal.update ({_id: member}, 
                        {status: status});
      } 
      
      //Update the loan cycle to record the total paid amount
      yield GroupHistory.findOneAndUpdate({
        group: group._id,
        cycles: {
          $elemMatch: {
              cycle_number: group.loan_cycle_number
          }
        }
      }, {
        $set: {
          'cycles.$.total_paid_amount': group.total_granted_amount
        }
      })
    }

    else {
      let statuses = []; let granted_amount = 0; let paid_amount = 0;
      for (let member of group.members){
        let client = yield ClientDal.get ({_id:member});
        statuses.push(client.status);

        //TODO: preferably better to fetch the loan prooposal by client acat to make sure we are updating the right loan proposal
        let loanProposal = yield LoanProposal.findOne ({client: member})
                            .sort({ date_created: -1 })
                            .exec();
        granted_amount += loanProposal.loan_approved; 
        if (client.status === "loan_paid"){
          paid_amount += loanProposal.loan_approved; //because they are going to pay the granted amount
        }     

      }
      let status = statusChecker (statuses);
      
      if (status){
        //if status becomes loan_Paid, or payment_in_progress, add up the total loan paid amount of each member and update group
        if (status.group === "loan_granted" || status.group === "appraisal_in_progress"){        
          updatedGroup = yield GroupDal.update ({_id:this.params.id},
                            {status: status.group, total_granted_amount: granted_amount});

          //Update the loan cycle to record the total granted amount
          yield GroupHistory.findOneAndUpdate({
            group: this.params.id,
            cycles: {
              $elemMatch: {
                  cycle_number: updatedGroup.loan_cycle_number
              }
            }
          }, {
            $set: {
              'cycles.$.total_granted_amount': granted_amount
            }
          }) 
        }
        else if (status.group === "loan_paid" || status.group === "payment_in_progress"){
          updatedGroup = yield GroupDal.update ({_id:this.params.id},
            {status: status.group, total_paid_amount: paid_amount});
          
          //Update the loan cycle to record the total paid amount
          yield GroupHistory.findOneAndUpdate({
            group: this.params.id,
            cycles: {
              $elemMatch: {
                  cycle_number: updatedGroup.loan_cycle_number
              }
            }
          }, {
            $set: {
              'cycles.$.total_paid_amount': paid_amount
            }
          }) 
        
        }   
         

      }

    }  

    this.body = updatedGroup;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'GROUP_UPDATE_STATUS_ERROR',
      message: ex.message
    }));
  }



//Utilities
function statusChecker (statuses){
  

  if (containsOnly(statuses, ["loan_granted"])){
    return {
      group: "loan_granted"
    };
  }

  if (containsOnly(statuses, ["loan_paid"])){
    return {
      group: "loan_paid"
    };
  } 
  
  if (containsOnly(statuses, ["loan_granted", "loan_paid"])){
    return {
      group: "payment_in_progress"
    };
  }

  if (statuses.includes("loan_granted")){
    return {
      group: "appraisal_in_progress"
    }
  }

  return;

}

function containsOnly(orig, against){
  const filterAgainst = against.filter (item => !orig.includes(item));  
  const filterOrig = orig.filter(item => !against.includes(item));

  return !(filterAgainst.length + filterOrig.length);
}

}

exports.generateMembersList = function* generateMembersList(next){
  
  debug(`generate members list: ${this.params.id}`);

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'VIEW_GROUP_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  let query = {
    _id: this.params.id
  };

  try {
    let group = yield GroupDal.get(query);
    if(!group) throw new Error('Group Does Not Exist');

    yield LogDal.track({
      event: 'Generate_Group_Members_List',
      user: this.state._user._id ,
      message: `View group - ${group.name}`
    });

    let data = group._doc;
    for (let i = 1; i <= data.members.length; i++){
      data.members[i-1].sno = i;
      data.members[i-1].full_name = data.members[i-1].first_name + " " + data.members[i-1].last_name;
    }
    data.members = data.members.slice();
    if(data.leader){
      data.leader.full_name = data.leader.first_name + " " + data.leader.last_name;
    }
    data.date = moment().format('MMMM Do YYYY');


  let template = "./templates/" + "MEMBERS_LIST_TEMPLATE.xlsx";
  //let template = "./templates/" + "test.docx";
  let docGenerator = new XLSX_GENERATOR(); 
  let report = yield docGenerator.generateXlsx(data, template);

  let buf = Buffer.from(report); 
  this.body = report;    

} catch(ex) {
  return this.throw(new CustomError({
    type: 'GENERATE_ACAT_PRINT_OUT_ERROR',
    message: ex.message
  }));
}


}


