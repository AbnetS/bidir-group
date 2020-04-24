// Notification Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var NotificationSchema = new Schema({      
    message:     { type: String, default: '' },
    for:         { type: Schema.Types.ObjectId, ref: 'User', default: null },
    task_ref:    { type: Schema.Types.ObjectId, ref: 'Task', default: null },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
NotificationSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
NotificationSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter Notification Attributes to expose
 */
NotificationSchema.statics.attributes = {
  _id: 1,
  message: 1,
  for: 1,
  task_ref: 1,
  date_created: 1,
  last_modified: 1
};


// Expose Notification model
module.exports = mongoose.model('Notification', NotificationSchema);