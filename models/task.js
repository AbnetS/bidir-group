// Task Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var TaskSchema = new Schema({      
    entity_type: { type: String },
    entity_ref:  { type: Schema.Types.ObjectId },
    user:        { type: Schema.Types.ObjectId, ref: 'User', default: null },
    task:        { type: String },
    task_type:   { type: String },
    status:      { type:String, enums:['pending', 'approved', 'declined'], default: 'pending'},
    created_by:     { type: Schema.Types.ObjectId, ref: 'User' },
    comment:        { type: String, default: '' },
    branch:         { type: Schema.Types.ObjectId, ref: 'Branch' },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
TaskSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
TaskSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter Task Attributes to expose
 */
TaskSchema.statics.attributes = {
   _id: 1,
  entity_type: 1,
  entity_ref: 1,
  task: 1,
  task_type: 1,
  status: 1,
  date_created: 1,
  last_modified: 1,
  user: 1,
  created_by: 1,
  comment:1,
  branch: 1
};


// Expose Task model
module.exports = mongoose.model('Task', TaskSchema);