// Crop Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var CropSchema = new Schema({
    name:           { type: String, default: '' },
    image:          { type: String, default: '' },
    category:       { type: String, default: '' },
    has_acat:       { type: Boolean, default: false },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
CropSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
CropSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter Crop Attributes to expose
 */
CropSchema.statics.attributes = {
  category: 1,
  name: 1,
  image: 1,
  has_acat: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose Crop model
module.exports = mongoose.model('Crop', CropSchema);