'use strict';
// Access Layer for GroupLoan Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-group');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const GroupLoan     = require('../models/groupLoan');
const Group         = require('../models/group');
const Loan          = require('../models/loan');
const Question      = require('../models/question');
const Section       = require('../models/section');
const Account       = require('../models/account');
const Client        = require('../models/client');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = GroupLoan.attributes;
var population = [{
  path: 'group',
  select: Group.attributes
},{
  path: 'loans',
  select: Loan.attributes,
  populate: [{
    path: 'questions',
    select: Question.attributes,
    options: {
      sort: { number: '1' }
    },
    populate: {
      path: 'sub_questions',
      select: Question.attributes,
      options: {
        sort: { number: '1' }
      }
    }
  },{
    path: 'sections',
    select: Section.attributes,
    options: {
      sort: { number: '1' }
    },
    populate: {
      path: 'questions',
      select: Question.attributes,
      options: {
        sort: { number: '1' }
      },
      populate: {
        path: 'sub_questions',
        select: Question.attributes,
        options: {
          sort: { number: '1' }
        }
      }
    }
  },{
    path: 'client',
    select: Client.attributes
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

    let unsavedGroupLoan = new GroupLoan(groupData);
    let newGroupLoan = yield unsavedGroupLoan.save();
    let group = yield exports.get({ _id: newGroupLoan._id });

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
exports.delete = function deleteGroupLoan(query) {
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

  return GroupLoan.findOneAndUpdate(query, updates, opts)
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
  
  //if (sort && sort === "last") {
    return GroupLoan.findOne(query, returnFields)
      .sort({ date_created: "desc" })
      .populate(population)
      .exec();
  //} else{
  //   return GroupLoan.findOne(query, returnFields)    
  //   .populate(population)
  //   .exec();
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
     GroupLoan
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
    GroupLoan.paginate(query, opts, function (err, docs) {
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

exports.getOngoingLoans = function* getCollection(query, qs, fields){

  let page = qs.page;
  let limit = qs.limit;
  let skip = (page -1) * limit;

  let allDocs = yield GroupLoan.aggregate([      
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



  let groupLoans = yield GroupLoan.aggregate([
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


  let populatedLoan = {};

      
  let populatedData = [];
  for (let loan of groupLoans){
    populatedLoan = yield GroupLoan.populate(loan.last_doc,population);    
    delete populatedLoan.populatedGroup;    
    populatedData.push(populatedLoan);
  
  };



  let data = {
    total_pages: Math.ceil(total_count / limit) || 1,
    total_docs_count: total_count,
    current_page: page,
    docs: populatedData
  }; 

 
  return data;

}
