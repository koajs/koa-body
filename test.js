/*!
 * koa-body
 * Copyright (c) 2014. Daryl Lau (@daryllau), Charlike Mike Reagent (@tunnckoCore)
 * MIT LICENSE
 */
var koa         = require('koa');
var betterBody  = require('./index');
var request     = require('supertest');
var http        = require('http');


function *hello() {
  var patchKoa  = (this.request.body) ? this.request.body : 'patchKoa=true, by default';
  var patchNode = (this.req.body) ? this.req.body : 'patchNode=false, by default';

  
  if (this.request.body || this.req.body) {
    this.body = JSON.stringify({koa: patchKoa, node: patchNode});
  }
  if (this.request.method == 'POST') {
    this.status = 201;
  }
  if (this.request.method == 'GET') {
    this.status = 200
  }
  if (this.request.method == 'PUT') {
    this.status = 200;
    this.body = 'resource updated successfully';
  }
  if (this.request.method == 'DELETE') {
    this.status = 204;
    this.body = null;
  }
  if (this.body == null || ((!this.request.body && !this.req.body) && this.body == 'resource updated successfully')) {
    this.status = 204;
    this.body = null;
  }
}


/**
 * [appDefault description]
 * @type {[type]}
 */
var appDefault = koa();
appDefault.use(betterBody());
appDefault.use(hello);
appDefault = http.createServer(appDefault.callback());


/**
 * [appAllPatched description]
 * @type {[type]}
 */
var appAllPatched = koa();
appAllPatched.use(betterBody({patchNode: true, jsonLimit: '1kb', formLimit: '1kb'}));
appAllPatched.use(hello);
appAllPatched = http.createServer(appAllPatched.callback());

/**
 * [appLimited description]
 * @type {[type]}
 */
var appLimited = koa();
appLimited.use(betterBody({jsonLimit: '1kb', formLimit: 8}));
appLimited.use(hello);
appLimited = http.createServer(appLimited.callback());


/**
 * [appNull description]
 * @type {[type]}
 */
var appNull = koa();
appNull.use(betterBody({patchKoa: false, jsonLimit: '1kb', formLimit: '1kb'}));
appNull.use(hello);
appNull = http.createServer(appNull.callback());



describe('appDefault: patchKoa=true, patchNode=false', function () {
  it('should GET / request 204 No Content', function (done) {
    request(appDefault)
    .get('/')
    .expect(204, done);
  });
  it('should POST / request 201 Created', function (done) {
    request(appDefault)
    .post('/')
    .send('user=abc12345')
    .expect(201, '{"koa":{"user":"abc12345"},"node":"patchNode=false, by default"}')
    .end(function(err, res){
      if(err) {
        done(err);
      } else {
        done();
      }
    });
  });
  it('should PUT / request 200 OK - updated successfully', function (done) {
    request(appDefault)
    .put('/')
    .send('user=abc123')
    .expect(200, 'resource updated successfully')
    .end(function(err, res){
      if(err) {
        done(err);
      } else {
        done();
      }
    });
  });
  it('should DELETE / request 204 OK - deleted successfully', function (done) {
    request(appDefault)
    .del('/')
    .send('userid=12')
    .expect(204, '')
    .end(function(err, res){
      if(err) {
        done(err);
      } else {
        done();
      }
    });
  });
});

describe('appLimited: patchKoa=true, patchNode=false', function () {
  it('should GET / request 204 No Content', function (done) {
    request(appLimited)
    .get('/')
    .expect(204, done);
  });
  it('should POST / request 201 Created', function (done) {
    request(appLimited)
    .post('/')
    .send('user=abc')
    .expect(201)
    .end(function(err, res){
      if(err) {
        done(err);
      } else {
        res.text.should.equal('{"koa":{"user":"abc"},"node":"patchNode=false, by default"}')
        res.text.length.should.equal(59)
        done();
      }
    });
  });
  it('should PUT / request 413 "Request Entity Too Large"', function (done) {
    request(appLimited)
    .put('/')
    .send('data=www-form-urlencoded')
    .expect(413)
    .expect('content-length', 24)
    .end(function(err, res){
      if(err) {
        done(err);
      } else {
        res.text.should.equal('Request Entity Too Large')
        done();
      }
    });
  });
});

describe('app: patchKoa=true, patchNode=true', function () {
  it('should GET / request 204 No Content', function (done) {
    request(appAllPatched)
    .get('/')
    .expect(204, done);
  });
  it('should POST / user=a1b2c3d4 request 201 Created', function (done) {
    request(appAllPatched)
    .post('/')
    .send('user=a1b2c3d4')
    .expect(201, '{"koa":{"user":"a1b2c3d4"},"node":{"user":"a1b2c3d4"}}')
    .end(function(err, res){
      if(err) {
        done(err);
      } else {
        done();
      }
    });
  });
  it('should POST / user=charlike request 201 Created', function (done) {
    request(appAllPatched)
    .post('/')
    .send('user=charlike')
    .expect(201, '{"koa":{"user":"charlike"},"node":{"user":"charlike"}}')
    .end(function(err, res){
      if(err) {
        done(err);
      } else {
        done();
      }
    });
  });
  it('should DELETE / user=charlike request 204 No Content', function (done) {
    request(appAllPatched)
    .del('/')
    .send('user=charlike')
    .expect(204, '')
    .end(function(err, res){
      if(err) {
        done(err);
      } else {
        done();
      }
    });
  });
});

describe('app: patchKoa=false, patchNode=false', function () {
  it('should GET / request 204 No Content', function (done) {
    request(appNull)
    .get('/')
    .expect(204, done);
  });
  it('should POST / request 204 No Content', function (done) {
    request(appNull)
    .post('/')
    .send('user=charlike')
    .expect(204)
    .end(function(err, res){
      if(err) {
        done(err);
      } else {
        done();
      }
    });
  });
  it('should PUT / request 204 No Content', function (done) {
    request(appNull)
    .put('/')
    .send('user=123')
    .expect(204)
    .end(function(err, res){
      if(err) {
        done(err);
      } else {
        done();
      }
    });
  });
});
