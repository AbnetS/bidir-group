// LoanProposal Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

const FORM     = require ('../lib/enums').FORM

var Schema = mongoose.Schema;

var LoanProposalSchema = new Schema({
    type:           { type: String, enum: FORM.TYPES },
    client:         { type: Schema.Types.ObjectId, ref: 'Client' },
    client_acat:    { type: Schema.Types.ObjectId, ref: 'ClientACAT' },
    status:         { type: String, default: 'new' },
    total_cost:     { type: Number, default: 0 },
    total_revenue:  { type: Number, default: 0 },
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
    },
    repayable:      { type: Number, default: 0 },
    cumulative_cash_flow: {         
        jan:            { type: Number, default: 0 },
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
    },
    loan_requested:       { type: Number, default: 0 },
    loan_approved:        { type: Number, default: 0 },
    loan_proposed:        { type: Number, default: 0 },
    loan_detail:          {
      max_amount:           { type: Number, default: 0 },
      total_deductibles:    { type: Number, default: 0 },
      total_cost_of_loan:   { type: Number, default: 0 },
      deductibles:    [{
        fixed_amount:   { type: Number, default: 0 },
        percent:        { type: Number, default: 0 },
        item:           { type: String, default: ''}
      }],
      cost_of_loan:   [{
        fixed_amount:   { type: Number, default: 0 },
        percent:        { type: Number, default: 0 },
        item:           { type: String, default: ''}
      }]
    },    
    created_by:     { type: Schema.Types.ObjectId, ref: 'User' },
    layout:         { type: String, default: FORM.LAYOUTS[0], enums: FORM.LAYOUTS },
    comment:        { type: String, default: '' },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
LoanProposalSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
LoanProposalSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter LoanProposal Attributes to expose
 */
LoanProposalSchema.statics.attributes = {
  type: 1,
  comment: 1,
  created_by: 1,
  client: 1,
  layout: 1,
  status: 1,
  total_revenue: 1,
  total_cost: 1,
  net_cash_flow: 1,
  cumulative_cash_flow: 1,
  loan_detail: 1,
  loan_proposed: 1,
  loan_approved: 1,
  loan_requested: 1,
  repayable: 1,
  client_acat: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose LoanProposal model
module.exports = mongoose.model('LoanProposal', LoanProposalSchema);