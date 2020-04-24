'use strict';

/**
 * Load Module Dependencies.
 */
const debug = require('debug')('api:check-permissions');
const co    = require('co');

const User        = require('../dal/user');
const Account     = require('../dal/account');
const Permission  = require('../dal/permission');
const Role        = require('../dal/role');

exports.isPermitted = function isPermitted(entity) {
  debug('Setup Permission Checker for ',  entity);

  return function (user, action) {
      debug('Checking Account: ', user.username, ' Permission: ', action);

    return co(function* (){
      let isAllowed = false;

      if(user.realm === 'super' || user.role === 'super') {
        isAllowed = true;

      } else {
        let account = yield Account.get({ user: user._id });
        if(account.role) {
          let role = yield Role.get({ _id: account.role._id });

          for(let permission of role.permissions) {
            permission = permission.toJSON();
            if(permission.entity === entity) {
              if(permission.operation.toUpperCase() === action || permission.name === action) {
                isAllowed = true;
              }
            }
          }
        }
        
      }

      return isAllowed;

    });
  }

 };

exports.hasPermission = function hasPermission(user, action) {
  debug('Checking Account: ', user.username, ' Permission: ', action);

  return co(function* (){
    let isAllowed = false;

    if(user.realm === 'super' || user.role === 'super') {
      isAllowed = true;

    } else {
      let account = yield Account.get({ user: user._id });
      if(account.role) {
        let role = yield Role.get({ _id: account.role._id });

        for(let permission of role.permissions) {
          if(permission.operation.toUpperCase() === action || permission.name === action) {
              isAllowed = true;
          }
        }
      }
      
    }

    return isAllowed;

  });

 };
