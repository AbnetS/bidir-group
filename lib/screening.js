'use strict';
/**
 * Load Module Dependencies
 */
let fs    = require('fs');
const url = require('url');

const request = require('request-promise');
const debug = require('debug')('api:cbs');
const pify  = require('pify');
const fse = require('fs-extra');
const $request = require('request');
const moment = require('moment');



fs = pify(fs);

const config = require('../config');

class SCREENING  {
    constructor (config){
        this.headers = config.headers

    }

    async createScreening (body){
        
        let bodyData = {
            "client":  body.client,
            "screening": body.screening,
            "for_group": true
        }

        

        let res = await this._makeRequest(bodyData, "/create", 
                    this.headers, 'POST') 
        
        return res;
    

    }

    
    async _makeRequest(data, endpoint, headers = {}, method = 'POST') {
        var header = {            
            accept: "application/json",
            authorization: headers.authorization
        }
        
        let opts = {
          method: method,
          url: `${config.SCREENING_SERVICE.URL}${endpoint}`,
          json: true,
          body: data,
          headers: header
        }

        debug (opts);
        console.log(opts);
    
        let res = await request(opts);        
    
        return res;
      }

      


}

module.exports = SCREENING;