// ACATSection Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var ACATSectionSchema = new Schema({       
    title:                  { type: String, default: '' },
    estimated_sub_total:    { type: Number },
    estimated_min_revenue:  { type: Number },
    estimated_max_revenue:  { type: Number },
    achieved_sub_total:     { type: Number },
    estimated_probable_revenue: { type: Number },
    achieved_revenue:           { type: Number },
    estimated_cash_flow:    { type: Schema.Types.Mixed }, // cash flow type
    achieved_cash_flow:     { type: Schema.Types.Mixed }, // cash flow type
    cost_list:       { type: Schema.Types.ObjectId, ref: 'CostList' },
    variety:         { type: String },
    seed_source:     { type: Schema.Types.Mixed },
    sub_sections:    [{ type: Schema.Types.ObjectId, ref: 'ACATSection' }],
    yield:           { type: Schema.Types.ObjectId, ref: 'CostListItem' },
    yield_consumption: { type: Schema.Types.ObjectId, ref: 'YieldConsumption' },
    number:          { type: Number, default: 1 },
    date_created:    { type: Date },
    last_modified:   { type: Date }
});

// add mongoose-troop middleware to support pagination
ACATSectionSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
ACATSectionSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter ACATSection Attributes to expose
 */
ACATSectionSchema.statics.attributes = {      
  title:                  1,
  estimated_sub_total:    1,
  estimated_min_revenue:  1,
  estimated_max_revenue:  1,
  achieved_sub_total:     1,
  estimated_cash_flow:    1, // cash flow type
  achieved_cash_flow:     1, // cash flow type
  cost_list:       1,
  variety:         1,
  seed_source:     1,
  sub_sections:    1,
  estimated_probable_revenue: 1,
  achieved_revenue:           1,
  yield:           1,
  yield_consumption: 1,
  number:          1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose ACATSection model
module.exports = mongoose.model('ACATSection', ACATSectionSchema);