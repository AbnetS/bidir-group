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

class ACAT {
    constructor (config){
        this.headers = config.headers

    }

    async initializeClientACAT (acatInitialData){
        
        let bodyData = {
            "client":  acatInitialData.client,
            "loan_product": acatInitialData.loan_product,
            "crop_acats": acatInitialData.crop_acats,
            "for_group": true
        }

        

        let res = await this._makeRequest(bodyData, "/clients/initialize", 
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
          url: `${config.ACAT_SERVICE.URL}${endpoint}`,
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

module.exports = ACAT;