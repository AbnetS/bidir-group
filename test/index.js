'use strict';

const should = require('chai').should();
const request = require('supertest');

const config = require('../config');
const root   = require('../routes/root');
const pkg    = require('../package.json');

const URL = config.API_URL;

describe('Root Endpoint', () => {
  describe('GET /', () => {
    it('should return metadata about api status', (done) => {

      request(URL)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((err, res) => {
          res.status.should.equal(200);
          res.body.name.should.be.a('string');
          res.body.version.should.equal(pkg.version);
          done();

        });
    });
  });
});
