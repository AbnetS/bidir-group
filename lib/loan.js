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

class LOAN {
    constructor (config){
        this.headers = config.headers

    }

    async createLoanApplication (clientId){
        //try{
        let bodyData = {
            "client":  clientId,
            "for_group": true
        }

        

        let res = await this._makeRequest(bodyData, "/create", 
                    this.headers, 'POST') 
        
        return res;
    // }catch (ex){
    //     return this.throw(new CustomError({
    //         type: 'GROUP_LOAN_ALL_CREATE_ERROR',
    //         message: ex.message
    //       }))
    //}

    }

    async updateLoanApplication (clientId){
        let bodyData = {
            "status": "submitted"
        }

        

        let res = await this._makeRequest(bodyData, "/" + clientId,
                    this.headers, 'PUT') 
        
        return res;
        
    }



    async getLoanApplication (clientId){
        let bodyData = {};

        let res =  await this._makeRequest (bodyData, "/clients/" + clientId, 
                    this.headers, "GET");
        
        return res;
    }

    async _makeRequest(data, endpoint, headers = {}, method = 'POST') {
        var header = {            
            accept: "application/json",
            authorization: headers.authorization
        }
        
        let opts = {
          method: method,
          url: `${config.LOAN_SERVICE.URL}${endpoint}`,
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

module.exports = LOAN;