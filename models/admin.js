'use strict';

/**
 * User Model Definition.
 * status: suspended, active, created
 */

/**
 * Load Module Dependencies.
 */
const mongoose  = require('mongoose');
const moment    = require('moment');
const paginator = require('mongoose-paginate');

const config    = require('../config');

var Schema = mongoose.Schema;

// New Admin Schema Instance
var AdminSchema = new Schema({
    user:           { type: Schema.Types.ObjectId, ref: 'User' },
    first_name:     { type: String, default: '' },
    last_name:      { type: String, default: '' },
    phone_number:   { type: String, default: '' },
    email:          { type: String, default: '' },
    archived:       { type: Boolean, default: false },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});


/**
 * Admin Attributes to expose
 */
AdminSchema.statics.attributes = {
    user: 1,
    first_name: 1,
    last_name: 1,
    email: 1,
    phone_number: 1,
    date_created:   1,
    last_modified: 1
};

// Add middleware to support pagination
AdminSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 */
AdminSchema.pre('save', function preSaveMiddleware(next) {
    let admin = this;

    try {
        // set date modifications
        let now = moment().toISOString();


        admin.date_created = now;
        admin.last_modified = now;

        next();

    } catch(ex) {
        next(ex);

    }

});

// Expose Admin model
module.exports = mongoose.model('Admin', AdminSchema);