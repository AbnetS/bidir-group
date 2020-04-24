'use strict';
// Access Layer for Group History Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-groupHistory');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const GroupHistory  = require ('../models/groupHistory');
const Group         = require('../models/group');
const Branch       = require('../models/branch');
const GroupScreening       = require('../models/groupScreening');
const GroupLoan      = require('../models/groupLoan');
const GroupACAT       = require('../models/groupACAT');
const User       = require('../models/user');

const mongoUpdate   = require('../lib/mongo-update');

var returnFields = GroupHistory.attributes;
var population = [{
  path: 'group',
  select: Group.attributes
},{
  path: 'branch',
  select: Branch.attributes
},{
  path: "cycles.screening",
  select: GroupScreening.attributes
},{
  path: "cycles.loan",
  select: GroupLoan.attributes
},{
  path:"cycles.acat",
  select: GroupACAT.attributes
},{
  path: "cycles.started_by",
  select: User.attributes
},{
  path: "cycles.last_edit_by",
  select: User.attributes
}
];

/**
 * create a new groupHistory.
 *
 * @desc  creates a new groupHistory and saves them
 *        in the database
 *
 * @param {Object}  groupHistoryData  Data for the groupHistory to create
 *
 * @return {Promise}
 */
exports.create = function create(groupHistoryData) {
  debug('creating a new groupHistory');

  return co(function* () {

    let unsavedGroupHistory = new GroupHistory(groupHistoryData);    
    let newGroupHistory = yield unsavedGroupHistory.save();
    let groupHistory = yield exports.get({ _id: newGroupHistory._id });

    return groupHistory;


  });

};

/**
 * delete a groupHistory
 *
 * @desc  delete data of the groupHistory with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteGroup(query) {
  debug('deleting groupHistory: ', query);

  return co(function* () {
    let groupHistory = yield exports.get(query);
    let _empty = {};

    if(!groupHistory) {
      return _empty;
    } else {
      yield groupHistory.remove();

      return groupHistory;
    }

  });
};

/**
 * update a groupHistory
 *
 * @desc  update data of the groupHistory with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating Group History: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return GroupHistory.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a groupHistory.
 *
 * @desc get a groupHistory with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, groupHistory) {
  debug('getting Group History ', query);

  return GroupHistory.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of groupHistorys
 *
 * @desc get a collection of groupHistorys from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of group histories');

  return new Promise((resolve, reject) => {
    resolve(
     GroupHistory
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of groupHistorys using pagination
 *
 * @desc get a collection of groupHistorys from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of groupHistorys');

  let opts = {
    select:  returnFields,
    sort:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    GroupHistory.paginate(query, opts, function (err, docs) {
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
