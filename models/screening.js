// Screening Model Definiton.

/**
 * Load Module Dependencies.
 * status: incomplete, completed, declined, approved, new
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

const FORM     = require ('../lib/enums').FORM

var Schema = mongoose.Schema;

var ScreeningSchema = new Schema({
    type:           { type: String, enum: FORM.TYPES },
    title:          { type: String, default: '' },
    subtitle:       { type: String, default: '' },
    purpose:        { type: String, default: '' },
    created_by:     { type: Schema.Types.ObjectId, ref: 'Account' },
    for_group:           { type: Boolean, default: false },
    layout:         { type: String, default: FORM.LAYOUTS[0], enums: FORM.LAYOUTS },
    has_sections:   { type: Boolean, default: false },
    sections:       [{ type: Schema.Types.ObjectId, ref: 'Section' }],
    signatures:     [{ type: String }],
    disclaimer:     { type: String, default: '' },
    questions:      [{ type: Schema.Types.ObjectId, ref: 'Question'}],
    created_by:     { type: Schema.Types.ObjectId, ref: 'User' },
    client:         { type: Schema.Types.ObjectId, ref: 'Client' },
    branch:         { type: Schema.Types.ObjectId, ref: 'Branch' },
    status:         { type: String, default: 'new' },
    comment:        { type: String, default: '' },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
ScreeningSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
ScreeningSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter Screening Attributes to expose
 */
ScreeningSchema.statics.attributes = {
  type: 1,
  title: 1,
  questions: 1,
  created_by: 1,
  has_sections: 1,
  sections: 1,
  subtitle: 1,
  purpose: 1,
  layout: 1,
  disclaimer: 1,
  signatures: 1,
  questions: 1,
  created_by: 1,
  client: 1,
  for_group: 1,
  status: 1,
  branch: 1,
  comment: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose Screening model
module.exports = mongoose.model('Screening', ScreeningSchema);
