'use strict';
// Client model Definiton.

/**
 * Load Module Dependencies.
 *
 */
const mongoose  = require('mongoose');
const moment    = require('moment');
const paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

// New Client Schema model
var ClientSchema = new Schema({
  branch:         { type: Schema.Types.ObjectId, ref: 'Branch'},
  created_by:     { type: Schema.Types.ObjectId, ref: 'User' },
  picture:        { type: String, default: '' },
  gender:         { type: String, default: 'SELECT' },
  first_name:     { type: String, default: '' },
  last_name:      { type: String, default: '' },
  grandfather_name: { type: String, default: '' },
  national_id_no:   { type: String, default: '' },
  national_id_card: { type: String, default: '' },
  date_of_birth:  { type: Date, default: null },
  civil_status:   { type: String, default: '' },
  woreda:         { type: String, default: '' },
  kebele:         { type: String, default: '' },
  house_no:       { type: String, default: '' },
  spouse:         {
    first_name:     { type: String, default: '' },
    last_name:      { type: String, default: '' },
    grandfather_name: { type: String, default: '' },
    national_id_no: { type: String, default: '' }
  },
  geolocation:    {
    latitude:   { type: Number, default: 0 },
    longitude:  { type: Number, default: 0 },
    longtude:  { type: Number, default: 0 },
    S2_Id:      { type: String, default: "NULL"},
    status:     { type: String, default: "NO ATTEMPT" }
  },
  email:          { type: String, default: '' },
  phone:          { type: String, default: '' },
  household_members_count: { type: String, default: "0" },
  status:         { type: String, default: 'new' },
  for_group:      { type: Boolean, default: 'false'},
  date_created:   { type: Date },
  cbs_status:         { type: String, default: "NO ATTEMPT" },
  cbs_status_message: { type: String, default: "None"},
  loan_cycle_number:  { type: Number, default: 1 },
  last_modified:  { type: Date }
});

/**
 * Client Attributes to expose
 */
ClientSchema.statics.attributes = {
  picture:        1,
  created_by:     1,
  branch:         1,
  gender:         1,
  first_name:     1,
  last_name:      1,
  grandfather_name: 1,
  national_id_no: 1,
  national_id_card: 1,
  date_of_birth:  1,
  civil_status:   1,
  woreda:         1,
  kebele:         1,
  house_no:       1,
  spouse:         1,
  email:          1,
  phone:          1,
  household_members_count: 1,
  geolocation: 1,
  status: 1,
  for_group: 1,
  cbs_status: 1,
  cbs_status_message: 1,
  loan_cycle_number: 1,
  date_created:   1,
  last_modified:  1,
  _id: 1
};

// Add middleware to support pagination
ClientSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 */
ClientSchema.pre('save', function preSaveMiddleware(next) {
  let client = this;

  // set date modifications
  let now = moment().toISOString();

  client.date_created = now;
  client.last_modified = now;

  next();

});

// Expose Client model
module.exports = mongoose.model('Client', ClientSchema);
