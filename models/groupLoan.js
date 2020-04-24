// GroupLoan Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var GroupLoanSchema = new Schema({       
    group:          { type: Schema.Types.ObjectId, ref: "Group" },
    loans:          [{ type: Schema.Types.ObjectId, ref: 'Loan'}],
    status:         { type: String, default: 'new' },
    created_by:     { type: Schema.Types.ObjectId, ref: 'User' },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
GroupLoanSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
GroupLoanSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter GroupLoan Attributes to expose
 */
GroupLoanSchema.statics.attributes = {
  group:           1,
  loans:  1,
  status:         1,
  created_by: 1,
  date_created:   1,
  last_modified:  1,
  _id: 1
};


// Expose GroupLoan model
module.exports = mongoose.model('GroupLoan', GroupLoanSchema);