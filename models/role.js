// Role Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var RoleSchema = new Schema({       
    name:           { type: String, required: true },
    description:    { type: String },
    permissions:    [{ type: Schema.Types.ObjectId, ref:'Permission'}], 
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
RoleSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
RoleSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter Role Attributes to expose
 */
RoleSchema.statics.attributes = {
  _id: 1,
  name: 1,
  description: 1,
  permissions: 1
};


// Expose Role model
module.exports = mongoose.model('Role', RoleSchema);
