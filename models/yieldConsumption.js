// YieldConsumption Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var YieldConsumptionSchema = new Schema({       
  estimated: {
    own_consumption:  { type: Number, default: 0 },
    seed_reserve:     { type: Number, default: 0 },
    for_market:       { type: Number, default: 0 },
    market_details:   [{ type: Schema.Types.Mixed }]
  },
  achieved: {
    own_consumption:  { type: Number, default: 0 },
    seed_reserve:     { type: Number, default: 0 },
    for_market:       { type: Number, default: 0 },
    market_details:   [{ type: Schema.Types.Mixed }]
  },
  remark:          { type: String, default: '' },
  date_created:    { type: Date },
  last_modified:   { type: Date }
});

// add mongoose-troop middleware to support pagination
YieldConsumptionSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
YieldConsumptionSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter YieldConsumption Attributes to expose
 */
YieldConsumptionSchema.statics.attributes = {      
  estimated: 1,
  achieved: 1,
  remark:   1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose YieldConsumption model
module.exports = mongoose.model('YieldConsumption', YieldConsumptionSchema);