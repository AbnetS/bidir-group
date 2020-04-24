'use strict';
// Access Layer for GroupACAT Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-group');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const GroupACAT   = require('../models/groupACAT');
const Group   = require('../models/group');
const ClientACAT         = require('../models/clientACAT');
const ACAT              = require('../models/ACAT');
const ACATSection       = require('../models/ACATSection');
const CostList          = require('../models/costList');
const CostListItem      = require('../models/costListItem');
const GroupedList       = require('../models/groupedList');
const LoanProduct       = require('../models/loanProduct');
const Crop              = require('../models/crop');
const YieldConsumption = require('../models/yieldConsumption');
const CashFlow        = require('../models/cashFlow');
const Client        = require('../models/client');
const User        = require('../models/user');
const Branch        = require('../models/branch');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = GroupACAT.attributes;
var population = [{
  path: 'group',
  select: Group.attributes
},{
  path: 'acats',
  select: ClientACAT.attributes,
  populate: [
  {
  path: 'ACATs',
  select: ACAT.attributes,
  populate: [{
      path: 'crop',
      select: Crop.attributes
    },{
    path: 'sections',
    select: ACATSection.attributes,
    options: {
        sort: { number: '1' }
    },
    populate: [{
      path: 'sub_sections',
      select: ACATSection.attributes,
      options: {
        sort: { number: '1' }
      },
      populate: [{
        path: 'sub_sections',
        select: ACATSection.attributes,
        options: {
          sort: { number: '1' }
        },
        populate: [{
          path: 'cost_list',
          select: CostList.attributes,
          populate: [{
            path: 'linear',
            select: CostListItem.attributes
          },{
            path: 'grouped',
            select: GroupedList.attributes,
            populate: {
              path: 'items',
              select: CostListItem.attributes
            }
          }]
        },{
          path: 'yield_consumption',
          select: YieldConsumption.attributes
        },{
          path: 'yield',
          select: CostListItem.attributes
        }]
      },{
        path: 'cost_list',
        select: CostList.attributes,
        populate: [{
          path: 'linear',
          select: CostListItem.attributes
        },{
           path: 'grouped',
          select: GroupedList.attributes,
          populate: {
              path: 'items',
              select: CostListItem.attributes
            }
        }]
      },{
        path: 'yield_consumption',
        select: YieldConsumption.attributes
      },{
        path: 'yield',
        select: CostListItem.attributes
      }]
    },{
      path: 'cost_list',
      select: CostList.attributes,
      populate: [{
        path: 'linear',
        select: CostListItem.attributes
      },{
         path: 'grouped',
        select: GroupedList.attributes,
        populate: {
              path: 'items',
              select: CostListItem.attributes
            }
      }]
    },{
      path: 'yield_consumption',
      select: YieldConsumption.attributes
    },{
      path: 'yield',
      select: CostListItem.attributes
    }]
  }]
},{
  path: 'loan_product',
  select: LoanProduct.attributes
},{
  path: 'created_by',
  select: User.attributes
},{
  path: 'client',
  select: Client.attributes
},{
  path: 'branch',
  select: Branch.attributes
}]
}];

/**
 * create a new group.
 *
 * @desc  creates a new group and saves them
 *        in the database
 *
 * @param {Object}  groupData  Data for the group to create
 *
 * @return {Promise}
 */
exports.create = function create(groupData) {
  debug('creating a new group');

  return co(function* () {

    let unsavedGroupACAT = new GroupACAT(groupData);
    let newGroupACAT = yield unsavedGroupACAT.save();
    let group = yield exports.get({ _id: newGroupACAT._id });

    return group;


  }); 

};

/**
 * delete a group
 *
 * @desc  delete data of the group with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteGroupACAT(query) {
  debug('deleting group: ', query);

  return co(function* () {
    let group = yield exports.get(query);
    let _empty = {};

    if(!group) {
      return _empty;
    } else {
      yield group.remove();

      return group;
    }

  });
};

/**
 * update a group
 *
 * @desc  update data of the group with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating group: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return GroupACAT.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a group.
 *
 * @desc get a group with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, sort) {
  debug('getting group ', query);

  //if (sort && sort === "last"){
    return GroupACAT.findOne(query, returnFields)
      .sort({ date_created: "desc" })
      .populate(population)
      .exec();
  // } else {
  //   return GroupACAT.findOne(query, returnFields)
  //       .populate(population)
  //       .exec();
  // }

};

/**
 * get a collection of groups
 *
 * @desc get a collection of groups from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of groups');

  return new Promise((resolve, reject) => {
    resolve(
     GroupACAT
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of groups using pagination
 *
 * @desc get a collection of groups from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of groups');

  let opts = {
    select:  returnFields,
    sort:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    GroupACAT.paginate(query, opts, function (err, docs) {
      if(err) {
        return reject(err);
      }

      let data = {
        total_pages: docs.pages,
        total_docs_count: docs.total,
        current_page: docs.page,
        docs: docs.docs
      };

      return resolve(data);

    });
  });


};

exports.getOngoingACAT = function* getCollection(query, qs, fields){

  let page = qs.page;
  let limit = qs.limit;
  let skip = (page -1) * limit;

  let allDocs = yield GroupACAT.aggregate([      
    {$match: query},
    {$sort: { date_created: -1 }},
    {$group: {
      _id: "$group",
      "group":{$push: "$group"}            
    }},
    {$lookup: {
      from: "groups",
      localField: "group",
      foreignField: "_id",
      as: "populatedGroup"
    }},
    {$match: { "populatedGroup.status": {$nin: ["loan_granted", "Loan-Granted", "loan_paid"]}}}
  
  ]).cursor({}).exec().toArray();

  //let total_count = allDocs.filter (item => item.populatedClient[0].status.includes ("ACAT")).length;
  let total_count = allDocs.length;



  let groupACATs = yield GroupACAT.aggregate([
    {$match: query},  
    {$lookup: {
      from: "groups",
      localField: "group",
      foreignField: "_id",
      as: "populatedGroup"
    }},
    {$match: { "populatedGroup.status": {$nin: ["loan_granted", "Loan-Granted", "loan_paid"]}}},   
    {$sort: { date_created: 1 }},
    {$group: {
      _id: "$group",
      "last_doc": { "$last": "$$ROOT" }           
    }},    
    {$skip: skip},
    {$limit: limit}
  ]).cursor({}).exec().toArray();


  let populatedACAT = {};

      
  let populatedData = [];
  for (let acat of groupACATs){
    populatedACAT = yield GroupACAT.populate(acat.last_doc,population);    
    delete populatedACAT.populatedGroup;    
    populatedData.push(populatedACAT);
  
  };



  let data = {
    total_pages: Math.ceil(total_count / limit) || 1,
    total_docs_count: total_count,
    current_page: page,
    docs: populatedData
  }; 

 
  return data;

}
