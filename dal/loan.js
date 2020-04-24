'use strict';
// Access Layer for Loan Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-loan');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const Loan          = require('../models/loan');
const Question        = require('../models/question');
const Section       = require('../models/section');
const Client        = require('../models/client');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = Loan.attributes;
var population = [{
  path: 'questions',
  select: Question.attributes,
  options: {
    sort: { number: '1' }
  },
  populate: {
    path: 'sub_questions',
    select: Question.attributes,
    options: {
      sort: { number: '1' }
    }
  }
},{
  path: 'sections',
  select: Section.attributes,
  options: {
    sort: { number: '1' }
  },
  populate: {
    path: 'questions',
    select: Question.attributes,
    options: {
      sort: { number: '1' }
    },
    populate: {
      path: 'sub_questions',
      select: Question.attributes,
      options: {
        sort: { number: '1' }
      }
    }
  }
},{
  path: 'client',
  select: Client.attributes
}];

/**
 * create a new loan.
 *
 * @desc  creates a new loan and saves them
 *        in the database
 *
 * @param {Object}  loanData  Data for the loan to create
 *
 * @return {Promise}
 */
exports.create = function create(loanData) {
  debug('creating a new loan');

  return co(function* () {

    let unsavedLoan = new Loan(loanData);
    let newLoan = yield unsavedLoan.save();
    let loan = yield exports.get({ _id: newLoan._id });

    return loan;


  });

};

/**
 * delete a loan
 *
 * @desc  delete data of the loan with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteLoan(query) {
  debug('deleting loan: ', query);

  return co(function* () {
    let loan = yield exports.get(query);
    let _empty = {};

    if(!loan) {
      return _empty;
    } else {
      yield loan.remove();

      return loan;
    }

  });
};

/**
 * update a loan
 *
 * @desc  update data of the loan with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating loan: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Loan.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a loan.
 *
 * @desc get a loan with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, loan) {
  debug('getting loan ', query);

  return Loan.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of loans
 *
 * @desc get a collection of loans from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of loans');

  return new Promise((resolve, reject) => {
    resolve(
     Loan
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of loans using pagination
 *
 * @desc get a collection of loans from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of loans');

  let opts = {
    select:  returnFields,
    sort:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    Loan.paginate(query, opts, function (err, docs) {
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
