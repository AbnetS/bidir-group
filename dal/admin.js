'use strict';
// Access Layer for Admin Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-admin');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const Admin    = require('../models/admin');
const User    = require('../models/user');
const mongoUpdate = require('../lib/mongo-update');

const returnFields = Admin.attributes;
var population = [{
  path: 'user',
  select: User.attributes
}];

/**
 * create a new admin.
 *
 * @desc  creates a new admin and saves them
 *        in the database
 *
 * @param {Object}  adminData  Data for the admin to create
 */
exports.create = function create(adminData) {
  debug('creating a new admin');


  return co(function* () {

    let newAdmin = new Admin(adminData);
    let admin = yield newAdmin.save();

    return yield exports.get({ _id: admin._id});

  });

};

/**
 * delete a admin
 *
 * @desc  delete data of the admin with the given
 *        id
 *
 * @param {Object}  query   Query Object
 */
exports.delete = function deleteItem(query) {
  debug(`deleting admin: ${query}`);

  return co(function* () {
    let admin = yield exports.get(query);
    let _empty = {};

    if(!admin) {
      return _empty;
    } else {
      yield admin.remove();

      return admin;
    }
  });
};

/**
 * update a admin
 *
 * @desc  update data of the admin with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 */
exports.update = function update(query, updates) {
  debug(`updating admin: ${query}`);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Admin.findOneAndUpdate(query, updates, opts)
              .populate(population)
              .exec();
};

/**
 * get a admin.
 *
 * @desc get a admin with the given id from db
 *
 * @param {Object} query Query Object
 */
exports.get = function get(query) {
  debug(`getting admin ${query}`);

  return Admin.findOne(query, returnFields)
              .populate(population)
              .exec();
};

/**
 * get a collection of admins
 *
 * @desc get a collection of admins from db
 *
 * @param {Object} query Query Object
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of admins');

  return co(function*() {
    let admins = yield Admin.find(query, returnFields).populate(population).exec();

    return admins;

  });

};

/**
 * get a collection of admins using pagination
 *
 * @desc get a collection of admins from db
 *
 * @param {Object} query Query Object
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of admins');

  let opts = {
    select:  returnFields,
    sort:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };

  return new Promise((resolve, reject) => {
    Admin.paginate(query, opts, function (err, docs) {
      if(err) {
        return reject(err);
      }

      let data = {
        total_pages: docs.pages,
        total_docs_count: docs.total,
        current_page: docs.page,
        docs: docs.docs
      };

      resolve(data);

    });
  });

};
