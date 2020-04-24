'use strict';
// Log Model Definiton.

/**
 * Load Module Dependencies.
 */
const mongoose  = require('mongoose');
const moment    = require('moment');
const paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

// New Log Schema Instance
var LogSchema = new Schema({
  user:           { type: Schema.Types.ObjectId, ref: 'User' },
  event:          { type: String },
  message:        { type: String },
  diff:           { type: Object },
  date_created:   { type: Date },
  last_modified:  { type: Date }
});

/**
 * Model Attributes to expose
 */
LogSchema.statics.attributes = {
  user: 1,
  event: 1,
  message: 1,
  diff: 1,
  date_created: 1,
  last_modified: 1
};

// add middleware to support pagination
LogSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 */
LogSchema.pre('save', function preSaveMiddleware(next) {
  let log = this;

  // set date modifications
  let now = moment().toISOString();

  log.date_created = now;
  log.last_modified = now;

  next();

});

// Expose Log model
module.exports = mongoose.model('Log', LogSchema);
