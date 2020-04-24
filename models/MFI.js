// MFI Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var MFISchema = new Schema({
    name:           { type: String, required:true },
    location:       { type: String, required:true },
    logo:           { type: String, default:"", required:true },
    establishment_year:       { type: String, default:"" },
    website_link:             { type: String, default:"" },
    email:          { type: String, default:"" },
    phone:          { type: String, default:"" },
    contact_person: {type: String, default: "" },
    branches:        [{type: Schema.Types.ObjectId, ref: "Branch"}],
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
MFISchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
MFISchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter MFI Attributes to expose
 */
MFISchema.statics.attributes = {
  name: 1,
  location: 1,
  logo:  1,
  establishment_year: 1,
  website_link:  1,
  email:  1,
  phone:  1,
  contact_person: 1,
  branches: 1,
  date_created: 1,
  last_modified:  1
};


// Expose MFI model
module.exports = mongoose.model('MFI', MFISchema);
