// GroupACAT Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var GroupACATSchema = new Schema({       
    group:      { type: Schema.Types.ObjectId, ref: "Group" },
    acats:     [{ type: Schema.Types.ObjectId, ref: 'ClientACAT'}],
    status:         { type: String, default: 'new' },
    created_by:     { type: Schema.Types.ObjectId, ref: 'User' },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
GroupACATSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
GroupACATSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter GroupACAT Attributes to expose
 */
GroupACATSchema.statics.attributes = {
  group:           1,
  acats:  1,
  created_by: 1,
  status:         1,
  date_created:   1,
  last_modified:  1,
  _id: 1
};


// Expose GroupACAT model
module.exports = mongoose.model('GroupACAT', GroupACATSchema);