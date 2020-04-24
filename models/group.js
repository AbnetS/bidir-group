// Group Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var GroupSchema = new Schema({       
    name:           { type: String, default: '' },
    no_of_members:  { type: Number, default: 0 },
    members:        [{ type: Schema.Types.ObjectId, ref: 'Client'}],
    created_by:     { type: Schema.Types.ObjectId, ref: 'User' },
    leader:         { type: Schema.Types.ObjectId, ref: 'Client', default: null },
    branch:         { type: Schema.Types.ObjectId, ref: 'Branch' },
    total_amount:   { type: Number, default: 0 },
    total_granted_amount:   { type: Number, default: 0 },
    total_paid_amount:      { type: Number, default: 0 },
    status:         { type: String, default: 'new' },
    loan_cycle_number:      { type: Number, default: 1},
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
GroupSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
GroupSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter Group Attributes to expose
 */
GroupSchema.statics.attributes = {
  name:           1,
  no_of_members:  1,
  members:        1,
  created_by:     1,
  leader:         1,
  total_amount:   1,
  total_granted_amount: 1,
  total_paid_amount:    1,
  status:         1,
  loan_cycle_number:    1,
  date_created:   1,
  last_modified:  1,
  branch: 1,
  _id: 1
};


// Expose Group model
module.exports = mongoose.model('Group', GroupSchema);