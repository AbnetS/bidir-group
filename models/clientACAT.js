// ACAT Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

const FORM     = require ('../lib/enums').FORM

var Schema = mongoose.Schema;

var ClientACATSchema = new Schema({
    client:         { type: Schema.Types.ObjectId, ref: 'Client' },
    branch:         { type: Schema.Types.ObjectId, ref: 'Branch' },
    created_by:     { type: Schema.Types.ObjectId, ref: 'User' },
    loan_product:   { type: Schema.Types.ObjectId, ref: 'LoanProduct', default: null },
    for_group:           { type: Boolean, default: false },
    ACATs:          [{ type: Schema.Types.ObjectId, ref: 'ACAT'}],
    status:         { type: String, default: 'new'},
    filling_status: { type: String, default: 'new' },
    estimated:      {
      total_cost:     { type: Number, default: 0 },
      total_revenue:  { type: Number, default: 0 },
      net_income:     { type: Number, default: 0 },
      net_cash_flow:  {
        jan:             { type: Number, default: 0 },
        feb:             { type: Number, default: 0 },
        mar:             { type: Number, default: 0 },
        apr:             { type: Number, default: 0 },
        may:             { type: Number, default: 0 },
        june:            { type: Number, default: 0 },
        july:            { type: Number, default: 0 },
        aug:             { type: Number, default: 0 },
        sep:             { type: Number, default: 0 },
        oct:             { type: Number, default: 0 },
        nov:             { type: Number, default: 0 },
        dec:             { type: Number, default: 0 }
      }
    },
    achieved:      {
      total_cost:     { type: Number, default: 0 },
      total_revenue:  { type: Number, default: 0 },
      net_income:     { type: Number, default: 0 },
      net_cash_flow:  {
        jan:             { type: Number, default: 0 },
        feb:             { type: Number, default: 0 },
        mar:             { type: Number, default: 0 },
        apr:             { type: Number, default: 0 },
        may:             { type: Number, default: 0 },
        june:            { type: Number, default: 0 },
        july:            { type: Number, default: 0 },
        aug:             { type: Number, default: 0 },
        sep:             { type: Number, default: 0 },
        oct:             { type: Number, default: 0 },
        nov:             { type: Number, default: 0 },
        dec:             { type: Number, default: 0 }
      }
    },
    comment:        { type: String, default: '' },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
ClientACATSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
ClientACATSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter ACAT Attributes to expose
 */
ClientACATSchema.statics.attributes = {
  client: 1,
  comment: 1,
  filling_status: 1,
  branch: 1,
  created_by: 1,
  loan_product: 1,
  ACATs: 1,
  estimated: 1,
  achieved: 1,
  date_created: 1,
  status: 1,
  for_group: 1,
  last_modified: 1,
  _id: 1
};


// Expose ACAT model
module.exports = mongoose.model('ClientACAT', ClientACATSchema);
