'use strict'; // Access Layer for User Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-user');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const User        = require('../models/user');
const Account      = require('../models/account');
const Admin       = require('../models/admin');

const mongoUpdate = require('../lib/mongo-update');

var returnFields = User.attributes;
var population = [{
  path: 'account',
  select: Account.attributes
},{
  path: 'admin',
  select: Admin.attributes
}];


/**
 * create a new user.
 *
 * @desc  creates a new user and saves them
 *        in the database
 *
 * @param {Object}  userData  Data for the user to create
 *
 * @return {Promise}
 */
exports.create = function create(userData) {
  debug('creating a new user');

  return co(function* () {

    let unsavedUser = new User(userData);
    let newUser = yield unsavedUser.save();
    let user = yield exports.get({ _id: newUser._id });

    return user;


  });


};

/**
 * delete a user
 *
 * @desc  delete data of the user with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteUser(query) {
  debug('deleting user: ', query);

  return co(function* () {
    let user = yield exports.get(query);
    let _empty = {};

    if(!user) {
      return _empty;
    } else {
      yield user.remove();

      return user;
    }

  });
};

/**
 * update a user
 *
 * @desc  update data of the user with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating user: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return User.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a user.
 *
 * @desc get a user with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, populate) {
  debug('getting user ', query);

  populate = populate || false;

  return co(function*() {
    let user;

    if(populate) {
      user = yield User.findOne(query, returnFields).populate(population).exec();

      if(user && user.player) {
        let player = yield Player.populate(user.player, [{
          path: 'device',
          select: Device.attributes
        },{
          path: 'preferences',
          select: Preference.attributes
        },{
          path: 'game',
          select: Game.attributes
        }]);

        user.player = player;
      }
    } else {
      user = yield User.findOne(query, returnFields).exec();
    }


    return user;

  });
};

/**
 * get a collection of users
 *
 * @desc get a collection of users from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of users');

  return new Promise((resolve, reject) => {
    resolve(
     User
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of users using pagination
 *
 * @desc get a collection of users from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of users');

  let opts = {
    select:  returnFields,
    sort:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    User.paginate(query, opts, function (err, docs) {
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


/**
 * Hash password
 */
exports.hashPasswd = function hashPasswd(passwd) {

  return new Promise((resolve, reject) => {
    User.hashPasswd(passwd, (err, hash) => {
      if(err) {
        return reject(err);
      }

      resolve(hash);
    });
  });
};
