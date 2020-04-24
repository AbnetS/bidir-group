'use strict';
// Access Layer for History Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-history');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const History      = require('../models/history');
const Client       = require('../models/client');
const Screening    = require('../models/screening');
const Loan         = require('../models/loan');
const ClientACAT    = require('../models/clientACAT');
const mongoUpdate  = require('../lib/mongo-update');

const returnFields = History.attributes;
var population = [{
  path: 'client',
  select: Client.attributes
},{
  path: 'screenings',
  select: Screening.attributes
},{
  path: 'loans',
  select: Loan.attributes
},{
  path: 'acats',
  select: ClientACAT.attributes
}];

/**
 * create a new history.
 *
 * @desc  creates a new history and saves them
 *        in the database
 *
 * @param {Object}  historyData  Data for the history to create
 */
exports.create = function create(historyData) {
  debug('creating a new history');


  return co(function* () {

    let newHistory = new History(historyData);
    let history = yield newHistory.save();

    return yield exports.get({ _id: history._id});

  });

};

/**
 * delete a history
 *
 * @desc  delete data of the history with the given
 *        id
 *
 * @param {Object}  query   Query Object
 */
exports.delete = function deleteItem(query) {
  debug(`deleting history: ${query}`);

  return co(function* () {
    let history = yield exports.get(query);
    let _empty = {};

    if(!history) {
      return _empty;
    } else {
      yield history.remove();

      return history;
    }
  });
};

/**
 * update a history
 *
 * @desc  update data of the history with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 */
exports.update = function update(query, updates) {
  debug(`updating history: ${query}`);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return History.findOneAndUpdate(query, updates, opts)
              .populate(population)
              .exec();
};

/**
 * get a history.
 *
 * @desc get a history with the given id from db
 *
 * @param {Object} query Query Object
 */
exports.get = function get(query) {
  debug(`getting history ${query}`);

  return History.findOne(query, returnFields)
              .populate(population)
              .exec();
};

/**
 * get a collection of histories
 *
 * @desc get a collection of histories from db
 *
 * @param {Object} query Query Object
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of histories');

  return co(function*() {
    let histories = yield History.find(query, returnFields).populate(population).exec();

    return histories;

  });

};

/**
 * get a collection of histories using pagination
 *
 * @desc get a collection of histories from db
 *
 * @param {Object} query Query Object
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of histories');

  let opts = {
    select:  returnFields,
    sort:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };

  return new Promise((resolve, reject) => {
    History.paginate(query, opts, function (err, docs) {
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
