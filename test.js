/**
 * koa-body - test.js
 * Copyright(c) 2014
 * MIT Licensed
 *
 * @author  Charlike Mike Reagent (@tunnckoCore)
 * @author  Daryl Lau (@daryllau)
 * @api private
 */
var fs      = require('fs'),
    koa     = require('koa'),
    koaBody = require('./index'),
    request = require('supertest'),
    http    = require('http');


function *hello() {
  var patchKoa  = (this.request.body) ? this.request.body : 'patchKoa=true, by default',
      patchNode = (this.req.body) ? this.req.body : 'patchNode=false, by default';

  
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
appDefault.use(koaBody());
appDefault.use(hello);
appDefault = http.createServer(appDefault.callback());


/**
 * [appAllPatched description]
 * @type {[type]}
 */
var appAllPatched = koa();
appAllPatched.use(koaBody({patchNode: true, jsonLimit: '1kb', formLimit: '1kb'}));
appAllPatched.use(hello);
appAllPatched = http.createServer(appAllPatched.callback());

var appAllPatchedMultipart = koa();
appAllPatchedMultipart.use(koaBody({
  patchNode: true,
  jsonLimit: '1kb',
  formLimit: '1kb',
  multipart: true,
  formidable: {
    uploadDir: __dirname,
    keepExtensions: true,
  }
}));
appAllPatchedMultipart.use(hello);
appAllPatchedMultipart = http.createServer(appAllPatchedMultipart.callback());

var appAllPatchedMultipart

/**
 * [appLimited description]
 * @type {[type]}
 */
var appLimited = koa();
appLimited.use(koaBody({jsonLimit: '1kb', formLimit: 8}));
filesFieldappLimited.use(hello);
appLimited = http.createServer(appLimited.callback());


/**
 * [appNull description]
 * @type {[type]}
 */
var appNull = koa();
appNull.use(koaBody({patchKoa: false, jsonLimit: '1kb', formLimit: '1kb'}));
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

describe('appAllPatched: patchKoa=true, patchNode=true', function () {
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
  it('should POST / 201 Created - multipart upload', function (done) {
    request(appAllPatchedMultipart)
    .post('/')
    .attach('filesField', 'package.json')
    .attach('fieldTwo', 'index.js')
    .expect(201)
    .end(function(err, res){
      if(err) {
        done(err);
      } else {
        var body = JSON.parse(res.text),
            koaFileOne = body.koa.files.filesField,
            koaFileTwo = body.koa.files.fieldTwo,
            nodFileOne = body.node.files.filesField,
            nodFileTwo = body.node.files.fieldTwo;

        // koa res: file avatar.png uploaded
        koaFileOne.name.should.equal('package.json');
        koaFileTwo.name.should.equal('index.js');

        // node res: file avatar.png uploaded
        nodFileOne.name.should.equal('package.json');
        nodFileTwo.name.should.equal('index.js');

        fs.unlinkSync(koaFileOne.path)
        fs.unlinkSync(koaFileTwo.path)
        done();
      }
    });
  });
});

describe('appNull: patchKoa=false, patchNode=false', function () {
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
