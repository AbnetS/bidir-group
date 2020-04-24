'use strict';
// Access Layer for Task Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-task');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const Task        = require('../models/task');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = Task.attributes;
var population = [];

/**
 * create a new task.
 *
 * @desc  creates a new task and saves them
 *        in the database
 *
 * @param {Object}  taskData  Data for the task to create
 *
 * @return {Promise}
 */
exports.create = function create(taskData) {
  debug('creating a new task');

  return co(function* () {
    let unsavedTask = new Task(taskData);
    let newTask = yield unsavedTask.save();
    let task = yield exports.get({ _id: newTask._id });

    return task;

  });

};

/**
 * delete a task
 *
 * @desc  delete data of the task with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteTask(query) {
  debug('deleting task: ', query);

  return co(function* () {
    let task = yield exports.get(query);
    let _empty = {};

    if(!task) {
      return _empty;
    } else {
      yield task.remove();

      return task;
    }

  });
};

/**
 * update a task
 *
 * @desc  update data of the task with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating task: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Task.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a task.
 *
 * @desc get a task with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, task) {
  debug('getting task ', query);

  return Task.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of tasks
 *
 * @desc get a collection of tasks from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of tasks');

  return new Promise((resolve, reject) => {
    resolve(
     Task
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of tasks using pagination
 *
 * @desc get a collection of tasks from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of tasks');

  let opts = {
    select:  returnFields,
    sortBy:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    Task.paginate(query, opts, function (err, docs) {
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
