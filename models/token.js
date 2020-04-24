'use strict';
// Token Model Definiton.

/**
 * Load Module Dependencies.
 */
const mongoose  = require('mongoose');
const moment    = require('moment');
const paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

// New Token Schema Instance
var TokenSchema = new Schema({
  value:          { type: String, default: 'NULL' },
  revoked:        { type: Boolean, default: true },
  user:           { type: Schema.Types.ObjectId, ref: 'User' },
  expires:        { type: Date, default: null },
  date_created:   { type: Date },
  last_modified:  { type: Date }
});

// add middleware to support pagination
TokenSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
TokenSchema.pre('save', function preSaveMiddleware(next) {
  let token = this;

  // set date modifications
  let now = moment().toISOString();

  token.date_created = now;
  token.last_modified = now;

  next();

});

/**
 * Model Attributes to expose
 */
TokenSchema.statics.attributes = {
  value: 1,
  revoked: 1,
  user: 1,
  expires: 1,
  date_created: 1
};


// Expose Token model
module.exports = mongoose.model('Token', TokenSchema);
