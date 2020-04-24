// History Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var GroupHistorySchema = new Schema({       
    group:         { type: Schema.Types.ObjectId, ref: 'Group'},
    cycles:         [{
        cycle_number: { type:Number, default: 1},
        total_amount: { type: Number, default: 0},
        total_granted_amount: { type: Number, default: 0},
        total_paid_amount: { type: Number, default: 0},
        screening:    { type:Schema.Types.ObjectId, ref: 'GroupScreening'},
        loan:         { type:Schema.Types.ObjectId, ref: 'GroupLoan'},
        acat:         { type: Schema.Types.ObjectId, ref: 'GroupACAT'},
        started_by:   { type: Schema.Types.ObjectId, ref: 'User'},
        last_edit_by: { type: Schema.Types.ObjectId, ref: 'User'},
        last_modified:  { type: Date },        
        status:       { type: String }
     }],
    branch:         { type: Schema.Types.ObjectId, ref: 'Branch' },
    cycle_number:   { type: Number, default: 1 },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
GroupHistorySchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
GroupHistorySchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter History Attributes to expose
 */
GroupHistorySchema.statics.attributes = {
  group: 1,
  branch: 1,
  cycle_number: 1,
  total_amount: 1,
  total_granted_amount: 1,
  total_paid_amount: 1,
  cycles: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose History model
module.exports = mongoose.model('GroupHistory', GroupHistorySchema);