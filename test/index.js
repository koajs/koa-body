/*!
 * koa-body <https://github.com/dlau/koa-body>
 * A koa body parser middleware with support for `multipart/form-data`,
 * `application/json` or `application/x-www-form-urlencoded` request bodies.
 * 
 * Copyright (c) 2014 Charlike Mike Reagent, Daryl Lau, contributors.
 * Released under the MIT license.
 */

'use strict';

var fs       = require('fs'),
    log      = console.log,
    koa      = require('koa'),
    http     = require('http'),
    request  = require('supertest'),
    koaBody  = require('../index'),
    Resource = require('koa-resource-router');

describe('koa-body', function () {
  var strify = JSON.stringify, database;

  beforeEach(function (done) {
    database = {
      "users": [
        {name: 'charlike', followers: 10},
        {name: 'tunnckocore', followers: 20}
      ]
    };
    done();
  });


  /**
   * DEFAULTS - multipart: false
   */
  it('should work with defaults - multipart: false, only `urlencoded` and `json` bodies', function (done) {
    var app = koa();

    var usersResource = new Resource('users', {
      // GET /users
      index: function *(next) {
        this.status = 200;
        this.body = database;
      }
    });

    app.use(koaBody());
    app.use(usersResource.middleware());

    request(http.createServer(app.callback()))
      .get('/users')
      .expect(200, database)
      .end(function(err, res) {
        if (err) return done(err);
        done();
      });
  });


  /**
   * MULTIPART - FIELDS
   */
  it('should recieve `multipart` requests - fields on .body.fields object', function (done) {
    var app = koa();
    var usersResource = new Resource('users', {
      // POST /users
      create: function *(next) {
        database.users.push(this.request.body.fields);
        this.status = 201;
        this.body = this.request.body;
      }
    });


    app.use(koaBody({multipart: true}));
    app.use(usersResource.middleware());

    request(http.createServer(app.callback()))
      .post('/users')
      .field('name', 'daryl')
      .field('followers', 30)
      .expect(201)
      .end(function(err, res) {
        if (err) return done(err);

        var requested = database.users.pop();
        res.body.fields.should.have.property('name', requested.name);
        res.body.fields.should.have.property('followers', requested.followers);

        res.body.fields.name.should.equal('daryl');
        res.body.fields.followers.should.equal('30');

        res.body.fields.should.have.property('name', 'daryl');
        res.body.fields.should.have.property('followers', '30');

        done();
      });
  });




  /**
   * MULTIPART - FILES
   */
  it('should recieve multiple files via `multipart` on .body.files object', function (done) {
    var app = koa();
    var usersResource = new Resource('users', {
      // POST /users
      create: function *(next) {
        this.status = 201;
        this.body = this.request.body;
      }
    });

    app.use(koaBody({
      multipart: true,
      formidable: {
        uploadDir: __dirname + '/../'
      }
    }));
    app.use(usersResource.middleware());

    request(http.createServer(app.callback()))
      .post('/users')
      .type('multipart/form-data')
      .attach('firstField', 'package.json')
      .attach('secondField', 'index.js')
      .attach('thirdField', 'LICENSE')
      .expect(201)
      .end(function(err, res){
        if (err) return done(err);

        res.body.files.firstField.name.should.equal('package.json');
        fs.unlinkSync(res.body.files.firstField.path);

        res.body.files.secondField.name.should.equal('index.js');
        fs.unlinkSync(res.body.files.secondField.path);
        res.body.files.thirdField.name.should.equal('LICENSE');
        fs.unlinkSync(res.body.files.thirdField.path);

        done();
      });
  });



  /**
   * URLENCODED request body
   */
  it('should recieve `urlencoded` request bodies', function (done) {
    var app = koa();
    var usersResource = new Resource('users', {
      // POST /users
      create: function *(next) {
        database.users.push(this.request.body);
        this.status = 201;
        this.body = this.request.body;
      }
    });


    app.use(koaBody({multipart: true}));
    app.use(usersResource.middleware());

    request(http.createServer(app.callback()))
      .post('/users')
      .type('application/x-www-form-urlencoded')
      .send({ name : 'example', followers : '41' })
      .expect(201)
      .end(function(err, res) {
        if (err) return done(err);

        var requested = database.users.pop();
        res.body.should.have.property('name', requested.name);
        res.body.should.have.property('followers', requested.followers);

        res.body.name.should.equal('example');
        res.body.followers.should.equal('41');

        res.body.should.have.property('name', 'example');
        res.body.should.have.property('followers', '41');

        done();
      });
  });



  /**
   * JSON request body
   */
  it('should recieve `json` request bodies', function (done) {
    var app = koa();
    var usersResource = new Resource('users', {
      // POST /users
      create: function *(next) {
        database.users.push(this.request.body);
        this.status = 201;
        this.body = this.request.body;
      }
    });


    app.use(koaBody());
    app.use(usersResource.middleware());

    request(http.createServer(app.callback()))
      .post('/users')
      .type('application/json')
      .send({ name: 'json', followers : '313' })
      .expect(201)
      .end(function(err, res) {
        if (err) return done(err);

        var requested = database.users.pop();
        res.body.should.have.property('name', requested.name);
        res.body.should.have.property('followers', requested.followers);

        res.body.name.should.equal('json');
        res.body.followers.should.equal('313');

        res.body.should.have.property('name', 'json');
        res.body.should.have.property('followers', '313');

        done();
      });
  });



  /**
   * FORM (urlencoded) LIMIT
   */
  it('should request 413 Request Entity Too Large, because of `formLimit`', function (done) {
    var app = koa();
    var usersResource = new Resource('users', {
      // POST /users
      create: function *(next) {
        //suggestions for handling?
        //what if we want to make body more user-friendly?
      }
    });


    app.use(koaBody({formLimit: 10 /*bytes*/}));
    app.use(usersResource.middleware());

    request(http.createServer(app.callback()))
      .post('/users')
      .type('application/x-www-form-urlencoded')
      .send('user=www-form-urlencoded')
      .expect(413, 'Request Entity Too Large')
      .expect('content-length', 24)
      .end(done);
  });



  /**
   * JSON LIMIT
   */
  it('should request 413 Request Entity Too Large, because of `jsonLimit`', function (done) {
    var app = koa();
    var usersResource = new Resource('users', {
      // POST /users
      create: function *(next) {
        //suggestions for handling?
        //what if we want to make body more user-friendly?
      }
    });


    app.use(koaBody({jsonLimit: 10 /*bytes*/}));
    app.use(usersResource.middleware());

    request(http.createServer(app.callback()))
      .post('/users')
      .type('application/json')
      .send({name: 'some-long-name-for-limit'})
      .expect(413, 'Request Entity Too Large')
      .expect('content-length', 24)
      .end(done);
  });
});
