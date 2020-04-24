'use strict';
// Access Layer for Group Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-group');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const Group         = require('../models/group');
const Client        = require('../models/client');
const User          = require('../models/user');
const Branch       = require('../models/branch');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = Group.attributes;
var population = [{
  path: 'members',
  select: Client.attributes
},{
  path: 'leader',
  select: Client.attributes
},{
  path: 'created_by',
  select: User.attributes
},{
  path: 'branch',
  select: Branch.attributes
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

    let unsavedGroup = new Group(groupData);
    let newGroup = yield unsavedGroup.save();
    let group = yield exports.get({ _id: newGroup._id });

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
exports.delete = function deleteGroup(query) {
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

  return Group.findOneAndUpdate(query, updates, opts)
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
exports.get = function get(query, group) {
  debug('getting group ', query);

  return Group.findOne(query, returnFields)
    .populate(population)
    .exec();

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
     Group
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
    Group.paginate(query, opts, function (err, docs) {
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
