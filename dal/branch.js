'use strict';
// Access Layer for Branch Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-branch');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const Branch    = require('../models/branch');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = Branch.attributes;
var population = [];

/**
 * create a new branch.
 *
 * @desc  creates a new branch and saves them
 *        in the database
 *
 * @param {Object}  branchData  Data for the branch to create
 *
 * @return {Promise}
 */
exports.create = function create(branchData) {
  debug('creating a new branch');

  return co(function* () {

    let unsavedBranch = new Branch(branchData);
    let newBranch = yield unsavedBranch.save();
    let branch = yield exports.get({ _id: newBranch._id });

    return branch;


  });

};

/**
 * delete a branch
 *
 * @desc  delete data of the branch with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteBranch(query) {
  debug('deleting branch: ', query);

  return co(function* () {
    let branch = yield exports.get(query);
    let _empty = {};

    if(!branch) {
      return _empty;
    } else {
      yield branch.remove();

      return branch;
    }

  });
};

/**
 * update a branch
 *
 * @desc  update data of the branch with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating branch: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Branch.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a branch.
 *
 * @desc get a branch with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, branch) {
  debug('getting branch ', query);

  return Branch.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of branchs
 *
 * @desc get a collection of branchs from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of branchs');

  return new Promise((resolve, reject) => {
    resolve(
     Branch
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of branchs using pagination
 *
 * @desc get a collection of branchs from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of branchs');

  let opts = {
    select:  returnFields,
    sortBy:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    Branch.paginate(query, opts, function (err, docs) {
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
