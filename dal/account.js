'use strict';
// Access Layer for Account Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-account');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');
const async   = require('async');
const crypto  = require('crypto');

const Account     = require('../models/account');
const User        = require('../models/user');
const Role        = require('../models/role');
const Permission  = require('../models/permission');
const Branch      = require('../models/branch');
const mongoUpdate = require('../lib/mongo-update');

const returnFields = Account.attributes;
var population = [{
  path: 'user',
  select: User.attributes
},{
  path: 'role',
  select: Role.attributes
},{
  path: 'permissions',
  select: Permission.attributes
},{
  path: 'branch',
  select: Branch.attributes
}];

/**
 * create a new account.
 *
 * @desc  creates a new account and saves them
 *        in the database
 *
 * @param {Object}  accountData  Data for the account to create
 */
exports.create = function create(accountData) {
  debug('creating a new account');


  return co(function* () {

    let newAccount = new Account(accountData);
    let account = yield newAccount.save();

    return yield exports.get({ _id: account._id});

  });

};

/**
 * delete a account
 *
 * @desc  delete data of the account with the given
 *        id
 *
 * @param {Object}  query   Query Object
 */
exports.delete = function deleteItem(query) {
  debug(`deleting account: ${query}`);

  return co(function* () {
    let account = yield exports.get(query);
    let _empty = {};

    if(!account) {
      return _empty;
    } else {
      yield account.remove();

      return account;
    }
  });
};

/**
 * update a account
 *
 * @desc  update data of the account with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 */
exports.update = function update(query, updates) {
  debug(`updating account: ${query}`);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Account.findOneAndUpdate(query, updates, opts)
              .populate(population)
              .exec();
};

/**
 * get a account.
 *
 * @desc get a account with the given id from db
 *
 * @param {Object} query Query Object
 */
exports.get = function get(query) {
  debug(`getting account ${query}`);

  return Account.findOne(query, returnFields)
              .populate(population)
              .exec();
};

/**
 * get a collection of accounts
 *
 * @desc get a collection of accounts from db
 *
 * @param {Object} query Query Object
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of accounts');

  return co(function*() {
    let accounts = yield Account.find(query, returnFields).populate(population).exec();

    return accounts;

  });

};

/**
 * get a collection of accounts using pagination
 *
 * @desc get a collection of accounts from db
 *
 * @param {Object} query Query Object
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of accounts');

  let opts = {
    select:  returnFields,
    sort:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };

  return new Promise((resolve, reject) => {
    Account.paginate(query, opts, function (err, docs) {
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