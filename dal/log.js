'use strict';
// Access Layer for Log Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-log');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const Log        = require('../models/log');
const User       = require('../models/user');
const mongoUpdate = require('../lib/mongo-update');

var returnFields = Log.attributes;
var population = [{
  path: 'user',
  select: User.attributes
}];

/**
 * create a new log.
 *
 * @desc  creates a new log and saves them
 *        in the database
 *
 * @param {Object}  logData  Data for the log to create
 *
 * @return {Promise}
 */
exports.create = function create(logData) {
  debug('creating a new log');

  return co(function* () {

    let unsavedLog = new Log(logData);
    let newLog = yield unsavedLog.save();
    let log = yield exports.get({ _id: newLog._id });

    return log;

  });

};

/**
 * delete a log
 *
 * @desc  delete data of the log with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteLog(query) {
  debug('deleting log: ', query);

  return co(function* () {
    let log = yield exports.get(query);
    let _empty = {};

    if(!log) {
      return _empty;
    } else {
      yield log.remove();

      return log;
    }

  });
};

/**
 * update a log
 *
 * @desc  update data of the log with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating log: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Log.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a log.
 *
 * @desc get a log with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, log) {
  debug('getting log ', query);

  return Log.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of logs
 *
 * @desc get a collection of logs from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of logs');

  return new Promise((resolve, reject) => {
    resolve(
     Log
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of logs using pagination
 *
 * @desc get a collection of logs from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of logs');

  let opts = {
    select:  returnFields,
    sortBy:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    Log.paginate(query, opts, function (err, docs) {
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
 * Log event tracker.
 *
 * @desc wrapper for easier log events tracking
 *
 * @param {Object}
 *
 * @return {Promise}
 */
exports.track = function trackEvent(info) {

  return co(function* () {
    let evt = info.event;
    let message = info.message;
    let userId = info.user;
    let diff = info.diff;

    debug(`Tracking event: ${evt}`);

    let NewLog = new Log({ user: userId, event: evt, message: message, diff: diff });
    let log = yield NewLog.save();

    return log;

  });

};
