'use strict';

/**
 * Load Module Dependencies.
 */

const util       = require ('util');
const zlib       = require ('zlib');



class COMPRESSOR {
    constructor(){

    }

    async compressToGzip(data){

        let func =  util.promisify(this._compressToGzip);
      
          let result;
          try {
            result = await func(data);      
            return result;
          } catch (ex) {
            throw(ex);
          } 
        
        
    }

    _compressToGzip(data,cb){
        const buf = new Buffer(JSON.stringify(data), 'utf-8');

        zlib.gzip(buf, function(err,result){
              if (err){
                cb(err);
          
              } else
                cb(null, result)
            });
      }
      
}

module.exports = COMPRESSOR;