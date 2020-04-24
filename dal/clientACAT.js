'use strict';
// Access Layer for ClientACAT Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-form');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const ClientACAT        = require('../models/clientACAT');
const ACAT              = require('../models/ACAT');
const ACATSection       = require('../models/ACATSection');
const CostList          = require('../models/costList');
const CostListItem      = require('../models/costListItem');
const GroupedList       = require('../models/groupedList');
const LoanProduct       = require('../models/loanProduct');
const Crop              = require('../models/crop');
const YieldConsumption = require('../models/yieldConsumption');
const CashFlow        = require('../models/cashFlow');
const Client        = require('../models/client');
const User        = require('../models/user');
const Branch        = require('../models/branch');



const mongoUpdate   = require('../lib/mongo-update');

var returnFields = ClientACAT.attributes;
var population = [{
  path: 'ACATs',
  select: ACAT.attributes,
  populate: [{
      path: 'crop',
      select: Crop.attributes
    },{
    path: 'sections',
    select: ACATSection.attributes,
    options: {
        sort: { number: '1' }
    },
    populate: [{
      path: 'sub_sections',
      select: ACATSection.attributes,
      options: {
        sort: { number: '1' }
      },
      populate: [{
        path: 'sub_sections',
        select: ACATSection.attributes,
        options: {
          sort: { number: '1' }
        },
        populate: [{
          path: 'cost_list',
          select: CostList.attributes,
          populate: [{
            path: 'linear',
            select: CostListItem.attributes
          },{
            path: 'grouped',
            select: GroupedList.attributes,
            populate: {
              path: 'items',
              select: CostListItem.attributes
            }
          }]
        },{
          path: 'yield_consumption',
          select: YieldConsumption.attributes
        },{
          path: 'yield',
          select: CostListItem.attributes
        }]
      },{
        path: 'cost_list',
        select: CostList.attributes,
        populate: [{
          path: 'linear',
          select: CostListItem.attributes
        },{
           path: 'grouped',
          select: GroupedList.attributes,
          populate: {
              path: 'items',
              select: CostListItem.attributes
            }
        }]
      },{
        path: 'yield_consumption',
        select: YieldConsumption.attributes
      },{
        path: 'yield',
        select: CostListItem.attributes
      }]
    },{
      path: 'cost_list',
      select: CostList.attributes,
      populate: [{
        path: 'linear',
        select: CostListItem.attributes
      },{
         path: 'grouped',
        select: GroupedList.attributes,
        populate: {
              path: 'items',
              select: CostListItem.attributes
            }
      }]
    },{
      path: 'yield_consumption',
      select: YieldConsumption.attributes
    },{
      path: 'yield',
      select: CostListItem.attributes
    }]
  }]
},{
  path: 'loan_product',
  select: LoanProduct.attributes
},{
  path: 'created_by',
  select: User.attributes
},{
  path: 'client',
  select: Client.attributes
},{
  path: 'branch',
  select: Branch.attributes
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

    let unsavedClientACAT = new ClientACAT(formData);
    let newClientACAT = yield unsavedClientACAT.save();
    let form = yield exports.get({ _id: newClientACAT._id });

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
exports.delete = function deleteClientACAT(query) {
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

  return ClientACAT.findOneAndUpdate(query, updates, opts)
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

  return ClientACAT.findOne(query, returnFields)
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
     ClientACAT
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
exports.getCollectionByPagination = function getCollection(query, qs, fields) {
  debug('fetching a collection of forms');

  let opts = {
    select:  fields ? fields : returnFields,
    sort:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    ClientACAT.paginate(query, opts, function (err, docs) {
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
