// CostList Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var CostListSchema = new Schema({
    linear:          [{ type: Schema.Types.ObjectId, ref: 'CostListItem' }],
    grouped:         [{ type: Schema.Types.ObjectId, ref: 'GroupedList' }],
    date_created:    { type: Date },
    last_modified:   { type: Date }
});

// add mongoose-troop middleware to support pagination
CostListSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
CostListSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter CostList Attributes to expose
 */
CostListSchema.statics.attributes = {
  linear: 1,
  grouped: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose CostList model
module.exports = mongoose.model('CostList', CostListSchema);