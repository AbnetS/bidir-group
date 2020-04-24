const request = require('supertest');
var app = require ('../app')

request(app)
  .post('/branches/register')
  .expect('Content-Type', /json/)
  .expect('Content-Length', '163')
  .expect(201)
  .end(function(err, res) {
    if (err) throw err;
  });