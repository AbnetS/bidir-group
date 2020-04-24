'use strict';
// Access Layer for Role Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-role');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const Role        = require('../models/role');
const Permission       = require('../models/permission');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = Role.attributes;
var population = [{
  path: 'permissions',
  select: Permission.attributes
}];

/**
 * create a new role.
 *
 * @desc  creates a new role and saves them
 *        in the database
 *
 * @param {Object}  roleData  Data for the role to create
 *
 * @return {Promise}
 */
exports.create = function create(roleData) {
  debug('creating a new role');

  return co(function* () {
    let unsavedRole = new Role(roleData);
    let newRole = yield unsavedRole.save();
    let role = yield exports.get({ _id: newRole._id });

    return role;

  });

};

/**
 * delete a role
 *
 * @desc  delete data of the role with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteRole(query) {
  debug('deleting role: ', query);

  return co(function* () {
    let role = yield exports.get(query);
    let _empty = {};

    if(!role) {
      return _empty;
    } else {
      yield role.remove();

      return role;
    }

  });
};

/**
 * update a role
 *
 * @desc  update data of the role with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating role: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Role.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a role.
 *
 * @desc get a role with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, role) {
  debug('getting role ', query);

  return Role.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of roles
 *
 * @desc get a collection of roles from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of roles');

  return new Promise((resolve, reject) => {
    resolve(
     Role
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of roles using pagination
 *
 * @desc get a collection of roles from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of roles');

  let opts = {
    select:  returnFields,
    sortBy:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    Role.paginate(query, opts, function (err, docs) {
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
