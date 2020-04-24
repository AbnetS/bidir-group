'use strict';
// Access Layer for Client Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-client');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');
const async   = require('async');
const crypto  = require('crypto');

const Client     = require('../models/client');
const Branch      = require('../models/branch');
const User      = require('../models/user');
const mongoUpdate = require('../lib/mongo-update');

const returnFields = Client.attributes;
var population = [{
  path: 'created_by',
  select: User.attributes
},{
  path: 'branch',
  select: Branch.attributes
}];

/**
 * create a new client.
 *
 * @desc  creates a new client and saves them
 *        in the database
 *
 * @param {Object}  clientData  Data for the client to create
 */
exports.create = function create(clientData) {
  debug('creating a new client');


  return co(function* () {

    let newClient = new Client(clientData);
    let client = yield newClient.save();

    return yield exports.get({ _id: client._id});

  });

};

/**
 * delete a client
 *
 * @desc  delete data of the client with the given
 *        id
 *
 * @param {Object}  query   Query Object
 */
exports.delete = function deleteItem(query) {
  debug(`deleting client: ${query}`);

  return co(function* () {
    let client = yield exports.get(query);
    let _empty = {};

    if(!client) {
      return _empty;
    } else {
      yield client.remove();

      return client;
    }
  });
};

/**
 * update a client
 *
 * @desc  update data of the client with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 */
exports.update = function update(query, updates) {
  debug(`updating client: ${query}`);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Client.findOneAndUpdate(query, updates, opts)
              .populate(population)
              .exec();
};

/**
 * get a client.
 *
 * @desc get a client with the given id from db
 *
 * @param {Object} query Query Object
 */
exports.get = function get(query) {
  debug(`getting client ${query}`);

  return Client.findOne(query, returnFields)
              .populate(population)
              .exec();
};

/**
 * get a collection of clients
 *
 * @desc get a collection of clients from db
 *
 * @param {Object} query Query Object
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of clients');

  return co(function*() {
    let clients = yield Client.find(query, returnFields).populate(population).exec();

    return clients;

  });

};

/**
 * get a collection of clients using pagination
 *
 * @desc get a collection of clients from db
 *
 * @param {Object} query Query Object
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of clients');

  let opts = {
    select:  returnFields,
    sort:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };

  return new Promise((resolve, reject) => {
    Client.paginate(query, opts, function (err, docs) {
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