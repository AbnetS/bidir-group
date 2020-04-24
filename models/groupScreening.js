// GroupScreening Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var GroupScreeningSchema = new Schema({       
    group:  { type: Schema.Types.ObjectId, ref: "Group" },
    screenings:     [{ type: Schema.Types.ObjectId, ref: 'Screening'}],
    status:         { type: String, default: 'new' },    
    created_by:     { type: Schema.Types.ObjectId, ref: 'User' },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
GroupScreeningSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
GroupScreeningSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter GroupScreening Attributes to expose
 */
GroupScreeningSchema.statics.attributes = {
  group:           1,
  screenings:  1,
  status:         1,
  date_created:   1,
  last_modified:  1,
  _id: 1
};


// Expose GroupScreening model
module.exports = mongoose.model('GroupScreening', GroupScreeningSchema);