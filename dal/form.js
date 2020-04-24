'use strict';
// Access Layer for Form Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-form');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const Form          = require('../models/form');
const Question      = require('../models/question');
const Section       = require('../models/section');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = Form.attributes;
var population = [{
  path: 'questions',
  select: Question.attributes,
  populate: {
    path: 'sub_questions',
   select: Question.attributes,
  }
},{
  path: 'sections',
  select: Section.attributes
}];

/**
 * create a new form.
 *
 * @desc  creates a new form and saves them
 *        in the database
 *
 * @param {Object}  formData  Data for the form to create
 *
 * @return {Promise}
 */
exports.create = function create(formData) {
  debug('creating a new form');

  return co(function* () {

    let unsavedForm = new Form(formData);
    let newForm = yield unsavedForm.save();
    let form = yield exports.get({ _id: newForm._id });

    return form;


  });

};

/**
 * delete a form
 *
 * @desc  delete data of the form with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteForm(query) {
  debug('deleting form: ', query);

  return co(function* () {
    let form = yield exports.get(query);
    let _empty = {};

    if(!form) {
      return _empty;
    } else {
      yield form.remove();

      return form;
    }

  });
};

/**
 * update a form
 *
 * @desc  update data of the form with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating form: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Form.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a form.
 *
 * @desc get a form with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, form) {
  debug('getting form ', query);

  return Form.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of forms
 *
 * @desc get a collection of forms from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of forms');

  return new Promise((resolve, reject) => {
    resolve(
     Form
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of forms using pagination
 *
 * @desc get a collection of forms from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of forms');

  let opts = {
    select:  returnFields,
    sort:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    Form.paginate(query, opts, function (err, docs) {
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
