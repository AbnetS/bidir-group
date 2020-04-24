// CashFlow Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var CashFlowSchema = new Schema({       
  jan:             { type: Number, default: 0 },
  feb:             { type: Number, default: 0 },
  mar:             { type: Number, default: 0 },
  apr:             { type: Number, default: 0 },
  may:             { type: Number, default: 0 },
  june:            { type: Number, default: 0 },
  july:            { type: Number, default: 0 },
  aug:             { type: Number, default: 0 },
  sep:             { type: Number, default: 0 },
  oct:             { type: Number, default: 0 },
  nov:             { type: Number, default: 0 },
  dec:             { type: Number, default: 0 },
  date_created:    { type: Date },
  last_modified:   { type: Date }
});

// add mongoose-troop middleware to support pagination
CashFlowSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
CashFlowSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter CashFlow Attributes to expose
 */
CashFlowSchema.statics.attributes = {      
  jan:             1,
  feb:             1,
  mar:             1,
  apr:             1,
  may:             1,
  june:            1,
  july:            1,
  aug:             1,
  sep:             1,
  oct:             1,
  nov:             1,
  dec:             1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose CashFlow model
module.exports = mongoose.model('CashFlow', CashFlowSchema);