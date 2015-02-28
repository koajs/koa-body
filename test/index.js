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
    should   = require('should'),
    koa      = require('koa'),
    http     = require('http'),
    request  = require('supertest'),
    koaBody  = require('../index'),
    Resource = require('koa-resource-router'),
    assert   = require('assert'),
    _        = require('lodash');

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
        uploadDir: __dirname + '/temp'
      }
    }));
    app.use(usersResource.middleware());

    request(http.createServer(app.callback()))
      .post('/users')
      .type('multipart/form-data')
      .attach('firstField', 'package.json')
      .attach('secondField', 'index.js')
      .attach('secondField', 'package.json')
      .attach('thirdField', 'LICENSE')
      .attach('thirdField', 'README.md')
      .attach('thirdField', 'package.json')
      .expect(201)
      .end(function(err, res){
        if (err) return done(err);

        res.body.files.firstField.should.be.an.Object;
        res.body.files.firstField.name.should.equal('package.json');
        should(fs.statSync(res.body.files.firstField.path)).be.ok;
        fs.unlinkSync(res.body.files.firstField.path);

        res.body.files.secondField.should.be.an.Array.and.have.lengthOf(2);
        res.body.files.secondField[0].name.should.equal('index.js');
        should(fs.statSync(res.body.files.secondField[0].path)).be.ok;
        fs.unlinkSync(res.body.files.secondField[0].path);
        res.body.files.secondField[1].name.should.equal('package.json');
        should(fs.statSync(res.body.files.secondField[1].path)).be.ok;
        fs.unlinkSync(res.body.files.secondField[1].path);

        res.body.files.thirdField.should.be.an.Array.and.have.lengthOf(3);
        res.body.files.thirdField[0].name.should.equal('LICENSE');
        should(fs.statSync(res.body.files.thirdField[0].path)).be.ok;
        fs.unlinkSync(res.body.files.thirdField[0].path);
        res.body.files.thirdField[1].name.should.equal('README.md');
        should(fs.statSync(res.body.files.thirdField[1].path)).be.ok;
        fs.unlinkSync(res.body.files.thirdField[1].path);
        res.body.files.thirdField[2].name.should.equal('package.json');
        should(fs.statSync(res.body.files.thirdField[2].path)).be.ok;
        fs.unlinkSync(res.body.files.thirdField[2].path);

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



  describe('strict mode', function (done) {
    var app = null;
    var usersResource = null;
    beforeEach(function () {
      app = koa();
      //push an additional, to test the multi query
      database.users.push({name: 'charlike'});
      usersResource = new Resource('users', {
        // DELETE /users
        destroy: function *(next) {
          var user = this.params.user;
          var multi = !!this.request.body.multi;
          if(multi) {
            database.users = database.users.filter(function (element) {
              return element.name !== user;
            });
          }
          else {
            var index = _.findIndex(database.users, {name: user});
            database.users.splice(index, 1);
          }
          this.status = 204;
          this.body = ''
        }
      });
    });

    it('can enable strict mode', function(done) {
      app.use(koaBody({strict: true}));
      app.use(usersResource.middleware());

      request(http.createServer(app.callback()))
        .delete('/users/charlike')
        .type('application/x-www-form-urlencoded')
        .send({multi: true})
        .expect(204)
        .end(function(err, res) {
          if (err) return done(err);
            assert(_.findWhere(database.users, {name: 'charlike'}) !== undefined);
          done();
        });
    });

    it('can disable strict mode', function(done) {
      app.use(koaBody({strict: false}));
      app.use(usersResource.middleware());

      request(http.createServer(app.callback()))
        .delete('/users/charlike')
        .type('application/x-www-form-urlencoded')
        .send({multi: true})
        .expect(204)
        .end(function(err, res) {
          if (err) return done(err);
            assert(_.findWhere(database.users, {name: 'charlike'}) === undefined);
          done();
        });
    });

  });
  /**
   * JSON request body
   */
  describe('json request body', function (done) {

    var app = null;
    var result = null;

    beforeEach(function () {
      app = koa();

      var usersResource = new Resource('users', {
        // POST /users
        create: function *(next) {
          database.users.push(this.request.body);
          this.status = 201;
          this.body = this.request.body;
        },
        // GET /users
        index: function *(next) {
          this.status = 200;
          this.body = _.findWhere(database.users, {name: this.request.body.name});
        },
        // This is a weird example, can't think of a valid use case w/ resource
        // router
        // DELETE /users/:name
        destroy: function *(next) {
          var user = this.params.user;
          var multi = !!this.request.body.multi;
          if(multi) {
            database.users = database.users.filter(function (element) {
              return element.name !== user;
            });
          }
          else {
            var index = _.findIndex(database.users, {name: user});
            database.users.splice(index, 1);
          }
          this.status = 204;
          this.body = ''
        }
      });

      app.use(koaBody({strict: false}));
      app.use(usersResource.middleware());

    });

    describe('POST', function (done) {

      var result = null;

      beforeEach(function (done) {
        request(http.createServer(app.callback()))
          .post('/users')
          .type('application/json')
          .send({ name: 'json', followers : '313' })
          .expect(201)
          .end(function (err, res) {
            result = res;
            done(err);
          })
      });

      it('should parse the response body', function () {
        result.body.should.not.equal(null);
      });

      it('should set the follower count', function () {
        var requested = database.users.pop();
        result.body.should.have.property('name', requested.name);
        result.body.name.should.equal('json');
      });

    });

    describe('GET', function (done) {

      var result = null;

      beforeEach(function (done) {
        database.users.push({name: 'foo', followers: 111});
        request(http.createServer(app.callback()))
          .get('/users')
          .type('application/json')
          .send({ name: 'foo'})
          .expect(200)
          .end(function (err, res) {
            result = res;
            done(err);
          })
      });

      it('should parse the response body', function () {
        result.body.should.not.equal(null);
      });

      it('should return the user details', function () {
        result.body.name.should.equal('foo');
        result.body.followers.should.equal(111);
      });

    });

    describe('DELETE', function (done) {

      var result = null;

      beforeEach(function (done) {
        database.users.push({name: 'foo', followers: 111});
        database.users.push({name: 'foo', followers: 111});
        request(http.createServer(app.callback()))
          .delete('/users/foo')
          .type('application/json')
          .send({ multi: true})
          .expect(204)
          .end(function (err, res) {
            result = res;
            done(err);
          })
      });

      it('should delete all the users', function () {
        assert(_.findWhere(database.users, {name: 'foo'}) === undefined);
      });

    });
  });



  /**
   * FORM (urlencoded) LIMIT
   */
  it('should request 413 Payload Too Large, because of `formLimit`', function (done) {
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
      .expect(413, 'Payload Too Large')
      .expect('content-length', 17)
      .end(done);
  });



  /**
   * JSON LIMIT
   */
  it('should request 413 Payload Too Large, because of `jsonLimit`', function (done) {
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
      .expect(413, 'Payload Too Large')
      .expect('content-length', 17)
      .end(done);
  });


  it('should return empty body object with no content type', function (done) {
      var app = koa();
      var usersResource = new Resource('users', {
        // POST /users
        create: function *(next) {
          this.body = this.req.body;
          this.status = 200;
        }
      });


      app.use(koaBody());
      app.use(usersResource.middleware());

      request(http.createServer(app.callback()))
        .post('/users')
        .send('Hello <b>invalid</b> content type')
        .expect(200, {})
        .end(done);
    });


  it('should return empty body object with invalid content type', function (done) {
      var app = koa();
      var usersResource = new Resource('users', {
        // POST /users
        create: function *(next) {
          this.body = this.req.body;
          this.status = 200;
        }
      });


      app.use(koaBody());
      app.use(usersResource.middleware());

      request(http.createServer(app.callback()))
        .post('/users')
        .type('text/html')
        .send('Hello <b>invalid</b> content type')
        .expect(200, {})
        .end(done);
    });
});
