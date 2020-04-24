'use strict';

/**
 * Load Module dependencies.
 */
const path = require('path');

const env = process.env;

const PORT        = env.PORT || 8100;
const API_URL     = env.API_URL || 'http://127.0.0.1:8100';

const BASE_SCREENING_API_URL = env.BASE_API_URL || 'http://127.0.0.1:8040'; //For screening service
const BASE_LOAN_API_URL = env.BASE_API_URL || 'http://127.0.0.1:8110'; //For loan service
const BASE_ACAT_API_URL = env.BASE_API_URL || 'http://127.0.0.1:8120'; //For ACAT service


const NODE_ENV    = env.NODE_ENV || 'development';
const HOST        = env.HOST_IP || 'localhost';

const MONGODB_URL = env.MONGODB_URL || 'mongodb://127.0.0.1:27017/bidir';

let config = {

  // Root Configs 
  API_URL: API_URL,  

  ENV: NODE_ENV,

  PORT: PORT,

  HOST: HOST,


  MONGODB: {
    URL: MONGODB_URL,
    OPTS: {
      server:{
        auto_reconnect:true
      }
    }
  },

  CORS_OPTS: {
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization'
  },

  SALT_FACTOR: 12,

  TOKEN: {
    RANDOM_BYTE_LENGTH: 32
  },


  ASSETS: {
    FILE_SIZE: 2 * 1024 * 1024, // 1MB,
    URL: API_URL + '/media/',
    DIR: path.resolve(process.cwd(), './assets') + '/'
  },

  SCREENING_SERVICE: {  
    URL: BASE_SCREENING_API_URL + '/screenings'      
  },
  
  LOAN_SERVICE: {  
    URL: BASE_LOAN_API_URL + '/loans'      
  },

  ACAT_SERVICE: {  
    URL: BASE_ACAT_API_URL + '/acat'  
    
  }


};

module.exports = config;
