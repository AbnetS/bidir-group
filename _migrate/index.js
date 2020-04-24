'use strict';

const co        = require('co');
const mongoose  = require('mongoose');
const debug     = require('debug')('Migration:Controller');

const config    = require('../config');

mongoose.connect(config.MONGODB.URL);
mongoose.connection.on('error', (err) => {
  debug('Mongoose connection error');
  console.log(err);
  process.exit(1);
});
mongoose.connection.on('connected', () => {
  debug('Connected to mongodb');
});

var admins = require('./admins');

co(function* () {
  let collection = [ admins ];

  for(let item of collection) {
    yield item();
  }

}).then((results) => {
  mongoose.connection.close();

  console.log('---Data Migration complete---');

  process.exit();

}).catch((err) => {
  mongoose.connection.close();

  console.log(err);
  console.log('---Error occured during data migration---');

  process.exit(1);

});

