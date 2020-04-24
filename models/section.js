// Section Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var SectionSchema = new Schema({       
    title:           { type: String, default: '' },
    number:          { type: Number, default: 1 },
    questions:       [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    date_created:    { type: Date },
    last_modified:   { type: Date }
});

// add mongoose-troop middleware to support pagination
SectionSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
SectionSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter Section Attributes to expose
 */
SectionSchema.statics.attributes = {
  title: 1,
  number: 1,
  questions: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose Section model
module.exports = mongoose.model('Section', SectionSchema);