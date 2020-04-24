// Form Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

const FORM     = require ('../lib/enums').FORM

var Schema = mongoose.Schema;

var FormSchema = new Schema({       
    type:           { type: String, enum: FORM.TYPES },
    title:          { type: String, default: '' },
    subtitle:       { type: String, default: '' },
    purpose:        { type: String, default: '' },
    questions:      [{ type: Schema.Types.ObjectId, ref: 'Question'}],
    created_by:     { type: Schema.Types.ObjectId, ref: 'Account' },
    layout:         { type: String, default: FORM.LAYOUTS[0], enums: FORM.LAYOUTS },
    has_sections:   { type: Boolean, default: false },
    sections:       [{ type: Schema.Types.ObjectId, ref: 'Section' }],
    signatures:     [{ type: String }],
    disclaimer:     { type: String, default: '' },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
FormSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
FormSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter Form Attributes to expose
 */
FormSchema.statics.attributes = {
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
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose Form model
module.exports = mongoose.model('Form', FormSchema);