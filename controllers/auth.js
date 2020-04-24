'use strict';
/**
 * Load Module Dependencies.
 */

const debug     = require('debug')('api:auth-controller');

const config      = require('../config');
const CustomError = require('../lib/custom-error');

const LogDal      = require('../dal/log');

/**
 * Access Management control
 *
 * @desc
 *
 * @param {Array|String} roles allowed roles
 * @param {String} action action to apply
 */
exports.accessControl = function accessControl(roles, action) {

  action = action || 'ALLOW';
  roles = Array.isArray(roles) ? roles: [roles];
  
  return function* (next) {
    
    let user = this.state._user;

    if(!user) {
      return this.throw(new CustomError({
        type: 'AUTHORIZATION_ERROR',
        message: 'Please Login or register to continue'
      }));
    }

    debug(`Checking access control for ${user._id} - ${this.url}`);

    let userRole  = user.role;
    let userRealm = user.realm;
    let allowed   = false;

    for(let role of roles) {
      switch(role) {
        case '*':
        case userRole:
        case userRealm:
          allowed = true;
          break;
      }
    }

    if(!allowed) {
      return this.throw(new CustomError({
        type: 'AUTHORIZATION_ERROR',
        message: 'You are not Authorized to complete this action'
      }));

    }

    yield next;

  };
};

// Auth Token generator
function createToken() {
  debug('generate a token');

  let sha256 = crypto.createHash('sha256');
  let retry = 1;
  let randomBytes;

  try {
    randomBytes = crypto.randomBytes(config.TOKEN.RANDOM_BYTE_LENGTH).toString('hex');

    return sha256.update(randomBytes).digest('base64');

  } catch(ex) {
    if(retry <= 5) {
      createToken();
    }

    throw ex;
  }
}


