'use strict';
// Access Layer for Notification Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-notification');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const Notification        = require('../models/notification');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = Notification.attributes;
var population = [];

/**
 * create a new notification.
 *
 * @desc  creates a new notification and saves them
 *        in the database
 *
 * @param {Object}  notificationData  Data for the notification to create
 *
 * @return {Promise}
 */
exports.create = function create(notificationData) {
  debug('creating a new notification');

  return co(function* () {
    let unsavedNotification = new Notification(notificationData);
    let newNotification = yield unsavedNotification.save();
    let notification = yield exports.get({ _id: newNotification._id });

    return notification;

  });

};

/**
 * delete a notification
 *
 * @desc  delete data of the notification with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteNotification(query) {
  debug('deleting notification: ', query);

  return co(function* () {
    let notification = yield exports.get(query);
    let _empty = {};

    if(!notification) {
      return _empty;
    } else {
      yield notification.remove();

      return notification;
    }

  });
};

/**
 * update a notification
 *
 * @desc  update data of the notification with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating notification: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Notification.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a notification.
 *
 * @desc get a notification with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, notification) {
  debug('getting notification ', query);

  return Notification.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of notifications
 *
 * @desc get a collection of notifications from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of notifications');

  return new Promise((resolve, reject) => {
    resolve(
     Notification
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of notifications using pagination
 *
 * @desc get a collection of notifications from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of notifications');

  let opts = {
    select:  returnFields,
    sort:   qs.sort,
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    Notification.paginate(query, opts, function (err, docs) {
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
