// LoanProduct Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

const FORM     = require ('../lib/enums').FORM

var Schema = mongoose.Schema;

var LoanProductSchema = new Schema({
    type:           { type: String, enum: FORM.TYPES },
    client:         { type: Schema.Types.ObjectId, ref: 'Client' },
    name:           { type: String, default: '' },
    purpose:        { type: String, default: '' },
    currency:       { type: String, default: '' },
    maximum_loan_amount: { type: Number, default: 0 },
    deductibles:    [{
      fixed_amount:   { type: Number, default: 0 },
      percent:        { type: Number, default: 0 },
      item:           { type: String, default: ''}
    }],
    cost_of_loan:   [{
      fixed_amount:   { type: Number, default: 0 },
      percent:        { type: Number, default: 0 },
      item:           { type: String, default: ''}
    }],    
    created_by:     { type: Schema.Types.ObjectId, ref: 'User' },
    layout:         { type: String, default: FORM.LAYOUTS[0], enums: FORM.LAYOUTS },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
LoanProductSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
LoanProductSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter LoanProduct Attributes to expose
 */
LoanProductSchema.statics.attributes = {
  type: 1,
  name: 1,
  created_by: 1,
  deductibles: 1,
  client: 1,
  maximum_loan_amount: 1,
  purpose: 1,
  layout: 1,
  cost_of_loan: 1,
  currency: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose LoanProduct model
module.exports = mongoose.model('LoanProduct', LoanProductSchema);