// GroupedList Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var GroupedListSchema = new Schema({
    title:           { type: String },
    items:           [{ type: Schema.Types.ObjectId, ref: 'CostListItem'}],
    date_created:    { type: Date },
    last_modified:   { type: Date }
});

// add mongoose-troop middleware to support pagination
GroupedListSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
GroupedListSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter GroupedList Attributes to expose
 */
GroupedListSchema.statics.attributes = {
  title: 1,
  items: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose GroupedList model
module.exports = mongoose.model('GroupedList', GroupedListSchema);