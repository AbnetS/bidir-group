'use strict';
// Access Layer for Permission Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-permission');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const Permission    = require('../models/permission');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = Permission.attributes;
var population = [];

/**
 * create a new permission.
 *
 * @desc  creates a new permission and saves them
 *        in the database
 *
 * @param {Object}  permissionData  Data for the permission to create
 *
 * @return {Promise}
 */
exports.create = function create(permissionData) {
  debug('creating a new permission');

  return co(function* () {

    let unsavedPermission = new Permission(permissionData);
    let newPermission = yield unsavedPermission.save();
    let permission = yield exports.get({ _id: newPermission._id });

    return permission;


  });

};

/**
 * delete a permission
 *
 * @desc  delete data of the permission with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deletePermission(query) {
  debug('deleting permission: ', query);

  return co(function* () {
    let permission = yield exports.get(query);
    let _empty = {};

    if(!permission) {
      return _empty;
    } else {
      yield permission.remove();

      return permission;
    }

  });
};

/**
 * update a permission
 *
 * @desc  update data of the permission with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating permission: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Permission.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a permission.
 *
 * @desc get a permission with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, permission) {
  debug('getting permission ', query);

  return Permission.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of permissions
 *
 * @desc get a collection of permissions from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of permissions');

  return new Promise((resolve, reject) => {
    resolve(
     Permission
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of permissions using pagination
 *
 * @desc get a collection of permissions from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of permissions');

  let opts = {
    select:  returnFields,
    sortBy:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    Permission.paginate(query, opts, function (err, docs) {
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
