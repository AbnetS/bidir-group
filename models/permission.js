// Permission Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var enums     = require ('../lib/enums');

var Schema = mongoose.Schema;

var PermissionSchema = new Schema({       
    name:           { type: String, required: true },
    description:    { type: String }, 
    module:         { 
      type: String, 
      enums:[enums.MODULES.MFI_SETUP,enums.MODULES.USER_MANAGEMENT]
    },
    endpoints:  [{
      url: { type: String }
    }],
    operations:     [{ type: String }],
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
PermissionSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
PermissionSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter Permission Attributes to expose
 */
PermissionSchema.statics.whitelist = {
  name: 1,
  description: 1,
  module: 1,
  operations: 1,
  endpoints: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose Permission model
module.exports = mongoose.model('Permission', PermissionSchema);