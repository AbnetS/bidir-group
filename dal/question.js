'use strict';
// Access Layer for Question Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-question');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const Question    = require('../models/question');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = Question.attributes;
var population = [{
  path: 'sub_questions',
  select: Question.attributes
}];

/**
 * create a new question.
 *
 * @desc  creates a new question and saves them
 *        in the database
 *
 * @param {Object}  questionData  Data for the question to create
 *
 * @return {Promise}
 */
exports.create = function create(questionData) {
  debug('creating a new question');

  return co(function* () {

    let unsavedQuestion = new Question(questionData);
    let newQuestion = yield unsavedQuestion.save();
    let question = yield exports.get({ _id: newQuestion._id });

    return question;


  });

};

/**
 * delete a question
 *
 * @desc  delete data of the question with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteQuestion(query) {
  debug('deleting question: ', query);

  return co(function* () {
    let question = yield exports.get(query);
    let _empty = {};

    if(!question) {
      return _empty;
    } else {
      yield question.remove();

      return question;
    }

  });
};

/**
 * update a question
 *
 * @desc  update data of the question with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating question: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Question.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a question.
 *
 * @desc get a question with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, question) {
  debug('getting question ', query);

  return Question.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of questions
 *
 * @desc get a collection of questions from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of questions');

  return new Promise((resolve, reject) => {
    resolve(
     Question
      .find(query, returnFields)
      .populate(population)
      .stream());
  });


};

/**
 * get a collection of questions using pagination
 *
 * @desc get a collection of questions from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of questions');

  let opts = {
    select:  returnFields,
    sortBy:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    Question.paginate(query, opts, function (err, docs) {
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
