/* eslint-disable no-underscore-dangle */

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const request = require('supertest');
const should = require('should');
const Koa = require('koa');
const Router = require('koa-router');
const sinon = require('sinon');
const koaBody = require('../index');
const unparsed = require('../unparsed.js');

describe('koa-body', async () => {
  let database;
  let router;
  let app;

  beforeEach(async () => {
    app = new Koa();
    database = {
      users: [
        {
          name: 'charlike',
          followers: 10,
        },
        {
          name: 'tunnckocore',
          followers: 20,
        },
      ],
    };
    router = Router()
      .get('/users', (ctx, next) => {
        if (ctx.request.body && ctx.request.body.name) {
          ctx.body = database.users.find(element => element.name === ctx.request.body.name);
          ctx.status = 200;
          return next();
        }
        ctx.status = 200;
        ctx.body = database;
      })
      .get('/users/:user', (ctx) => {
        const user = database.users.find(element => element.name === ctx.request.body.name);
        ctx.status = 200;
        ctx.body = user;
      })
      .post('/users', (ctx, next) => {
        const user = ctx.request.body;

        if (!user) {
          ctx.status = 400;
          return next();
        }
        database.users.push(user);
        ctx.status = 201;

        // return request contents to validate
        ctx.body = {
          _files: ctx.request.files, // files we populate
          user, // original request data
        };
      })
      .post('/echo_body', (ctx) => {
        ctx.status = 200;
        ctx.body = ctx.request.body;
      })
      .delete('/users/:user', (ctx) => {
        const { user } = ctx.params;
        const multi = !!ctx.request.body.multi;
        if (multi) {
          database.users = database.users.filter(element => element.name !== user);
        } else {
          const index = database.users.findIndex(element => element === user);
          database.users.splice(index, 1);
        }
        ctx.status = 204;
        ctx.body = '';
      });
  });


  /**
   * DEFAULTS - multipart: false
   */
  it('should work with defaults - multipart: false, only `urlencoded` and `json` bodies', async () => {
    app.use(koaBody());
    app.use(router.routes());

    return request(http.createServer(app.callback()))
      .get('/users')
      .expect(200, database);
  });


  /**
   * MULTIPART - FIELDS
   */
  it('should receive `multipart` requests - fields on .body object', async () => {
    app.use(koaBody({ multipart: true }));
    app.use(router.routes());

    return request(http.createServer(app.callback()))
      .post('/users')
      .field('name', 'daryl')
      .field('followers', 30)
      .expect(201)
      .then((res) => {
        const mostRecentUser = database.users[database.users.length - 1];

        res.body.user.should.have.property('name', mostRecentUser.name);
        res.body.user.should.have.property('followers', mostRecentUser.followers);

        res.body.user.should.have.property('name', 'daryl');
        res.body.user.should.have.property('followers', '30');
      });
  });


  /**
   * MULTIPART - FILES
   */
  it('should receive multiple fields and files via `multipart` on .body.files object', async () => {
    app.use(koaBody({
      multipart: true,
      formidable: {
        uploadDir: `${__dirname}/temp`,
      },
    }));
    app.use(router.routes());

    return request(http.createServer(app.callback()))
      .post('/users')
      .type('multipart/form-data')
      .field('names', 'John')
      .field('names', 'Paul')
      .attach('firstField', 'package.json')
      .attach('secondField', 'index.js')
      .attach('secondField', 'package.json')
      .attach('thirdField', 'LICENSE')
      .attach('thirdField', 'README.md')
      .attach('thirdField', 'package.json')
      .expect(201)
      .then((res) => {
        res.body.user.names.should.be.an.Array().and.have.lengthOf(2);
        res.body.user.names[0].should.equal('John');
        res.body.user.names[1].should.equal('Paul');
        res.body._files.firstField.should.be.an.Object();
        res.body._files.firstField.name.should.equal('package.json');
        should(fs.statSync(res.body._files.firstField.path)).be.ok();
        fs.unlinkSync(res.body._files.firstField.path);

        res.body._files.secondField.should.be.an.Array().and.have.lengthOf(2);
        res.body._files.secondField.should.containDeep([{
          name: 'index.js',
        }]);
        res.body._files.secondField.should.containDeep([{
          name: 'package.json',
        }]);
        should(fs.statSync(res.body._files.secondField[0].path)).be.ok();
        should(fs.statSync(res.body._files.secondField[1].path)).be.ok();
        fs.unlinkSync(res.body._files.secondField[0].path);
        fs.unlinkSync(res.body._files.secondField[1].path);

        res.body._files.thirdField.should.be.an.Array().and.have.lengthOf(3);

        res.body._files.thirdField.should.containDeep([{
          name: 'LICENSE',
        }]);
        res.body._files.thirdField.should.containDeep([{
          name: 'README.md',
        }]);
        res.body._files.thirdField.should.containDeep([{
          name: 'package.json',
        }]);
        should(fs.statSync(res.body._files.thirdField[0].path)).be.ok();
        fs.unlinkSync(res.body._files.thirdField[0].path);
        should(fs.statSync(res.body._files.thirdField[1].path)).be.ok();
        fs.unlinkSync(res.body._files.thirdField[1].path);
        should(fs.statSync(res.body._files.thirdField[2].path)).be.ok();
        fs.unlinkSync(res.body._files.thirdField[2].path);
      });
  });

  it('can transform file names in multipart requests', async () => {
    app.use(koaBody({
      multipart: true,
      formidable: {
        uploadDir: `${__dirname}/temp`,
        onFileBegin: (name, file) => {
          const fileCopy = file;
          fileCopy.name = 'backage.json';
          const folder = path.dirname(fileCopy.path);
          fileCopy.path = path.join(folder, fileCopy.name);
        },
      },
    }));
    app.use(router.routes());

    return request(http.createServer(app.callback()))
      .post('/users')
      .type('multipart/form-data')
      .field('names', 'John')
      .field('names', 'Paul')
      .attach('firstField', 'package.json')
      .expect(201)
      .then((res) => {
        res.body._files.firstField.should.be.an.Object();
        res.body._files.firstField.name.should.equal('backage.json');
        should(fs.statSync(res.body._files.firstField.path)).be.ok();
        fs.unlinkSync(res.body._files.firstField.path);
      });
  });


  /**
   * URLENCODED request body
   */
  it('should recieve `urlencoded` request bodies', async () => {
    app.use(koaBody({ multipart: true }));
    app.use(router.routes());

    return request(http.createServer(app.callback()))
      .post('/users')
      .type('application/x-www-form-urlencoded')
      .send({
        name: 'example',
        followers: '41',
      })
      .expect(201)
      .then((res) => {
        const mostRecentUser = database.users[database.users.length - 1];

        res.body.user.should.have.properties(mostRecentUser);
        res.body.user.should.have.properties({ name: 'example', followers: '41' });
      });
  });

  /**
   * Inclusion of unparsed body when opts.includeUnparsed is true
   */
  describe('includeUnparsed tests', async () => {
    let requestSpy;

    beforeEach(async () => {
      app.use(koaBody({ includeUnparsed: true }));
      app.use(router.routes());
    });

    afterEach(() => {
      requestSpy.restore();
      requestSpy = undefined;
    });

    it('should not fail when no request body is provided', async () => {
      const echoRouterLayer = router.stack.filter(layer => layer.path === '/echo_body');
      requestSpy = sinon.spy(echoRouterLayer[0].stack, '0');

      return request(http.createServer(app.callback()))
        .post('/echo_body')
        .type('application/json')
        .send(undefined)
        .expect(200)
        .then((res) => {
          assert(requestSpy.calledOnce, 'Spy for /echo_body not called');
          const req = requestSpy.firstCall.args[0].request;

          req.body.should.not.be.Undefined();
          res.body.should.have.properties({});

          req.body[unparsed].should.not.be.Undefined();
          req.body[unparsed].should.be.a.String();
          req.body[unparsed].should.have.length(0);
        });
    });

    it('should recieve `urlencoded` request bodies with the `includeUnparsed` option', async () => {
      const userRouterLayer = router.stack.filter(layer => layer.path === '/users' && layer.methods.includes('POST'));
      requestSpy = sinon.spy(userRouterLayer[0].stack, '0');

      return request(http.createServer(app.callback()))
        .post('/users')
        .type('application/x-www-form-urlencoded')
        .send({
          name: 'Test',
          followers: '97',
        })
        .expect(201)
        .then((res) => {
          const mostRecentUser = database.users[database.users.length - 1];

          assert(requestSpy.calledOnce, 'Spy for /users not called');
          const req = requestSpy.firstCall.args[0].request;
          req.body[unparsed].should.not.be.Undefined();
          req.body[unparsed].should.be.a.String();
          req.body[unparsed].should.equal('name=Test&followers=97');

          res.body.user.should.have.properties({ name: 'Test', followers: '97' });
          res.body.user.should.have.properties(mostRecentUser);
        });
    });

    it('should receive JSON request bodies as strings with the `includeUnparsed` option', async () => {
      const echoRouterLayer = router.stack.filter(layer => layer.path === '/echo_body');
      requestSpy = sinon.spy(echoRouterLayer[0].stack, '0');

      return request(http.createServer(app.callback()))
        .post('/echo_body')
        .type('application/json')
        .send({
          hello: 'world',
          number: 42,
        })
        .expect(200)
        .then((res) => {
          assert(requestSpy.calledOnce, 'Spy for /echo_body not called');
          const req = requestSpy.firstCall.args[0].request;
          req.body[unparsed].should.not.be.Undefined();
          req.body[unparsed].should.be.a.String();
          req.body[unparsed].should.equal(JSON.stringify({
            hello: 'world',
            number: 42,
          }));

          res.body.should.have.properties({ hello: 'world', number: 42 });
        });
    });

    it('should receive text as strings with `includeUnparsed` option', async () => {
      const echoRouterLayer = router.stack.filter(layer => layer.path === '/echo_body');
      requestSpy = sinon.spy(echoRouterLayer[0].stack, '0');

      return request(http.createServer(app.callback()))
        .post('/echo_body')
        .type('text')
        .send('plain text content')
        .expect(200)
        .then((res) => {
          assert(requestSpy.calledOnce, 'Spy for /echo_body not called');
          const req = requestSpy.firstCall.args[0].request;
          should(req.body).equal('plain text content');

          // Raw text requests are still just text
          assert.equal(req.body[unparsed], undefined);

          // Text response is just text
          should(res.body).have.properties({});
          should(res.text).equal('plain text content');
        });
    });
  });

  /**
   * TEXT request body
   */
  it('should recieve `text` request bodies', async () => {
    app.use(koaBody({ multipart: true }));
    app.use(router.routes());

    return request(http.createServer(app.callback()))
      .post('/echo_body')
      .type('text')
      .send('plain text')
      .expect(200)
      .then((res) => {
        res.type.should.equal('text/plain');
        res.text.should.equal('plain text');
      });
  });

  describe('strict mode', async () => {
    beforeEach(async () => {
      // push an additional, to test the multi query
      database.users.push({ name: 'charlike' });
    });

    it('can enable strict mode', async () => {
      app.use(koaBody({ strict: true }));
      app.use(router.routes());

      return request(http.createServer(app.callback()))
        .delete('/users/charlike')
        .type('application/x-www-form-urlencoded')
        .send({ multi: true })
        .expect(204)
        .then(() => {
          assert(database.users.find(element => element.name === 'charlike') !== undefined);
        });
    });

    it('can disable strict mode', async () => {
      app.use(koaBody({ strict: false }));
      app.use(router.routes());

      return request(http.createServer(app.callback()))
        .delete('/users/charlike')
        .type('application/x-www-form-urlencoded')
        .send({ multi: true })
        .expect(204)
        .then(() => {
          assert(database.users.find(element => element.name === 'charlike') === undefined);
        });
    });
  });

  describe('parsedMethods options', async () => {
    beforeEach(async () => {
      // push an additional, to test the multi query
      database.users.push({ name: 'charlike' });
    });

    it('methods declared are parsed', async () => {
      app.use(koaBody({ parsedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'] }));
      app.use(router.routes());

      return request(http.createServer(app.callback()))
        .delete('/users/charlike')
        .type('application/x-www-form-urlencoded')
        .send({ multi: true })
        .expect(204)
        .then(() => {
          assert(database.users.find(element => element.name === 'charlike') === undefined);
        });
    });

    it('methods do not get parsed if not declared', async () => {
      app.use(koaBody({ parsedMethods: ['POST', 'PUT', 'PATCH'] }));
      app.use(router.routes());

      return request(http.createServer(app.callback()))
        .delete('/users/charlike')
        .type('application/x-www-form-urlencoded')
        .send({ multi: true })
        .expect(204)
        .then(() => {
          assert(database.users.find(element => element.name === 'charlike') !== undefined);
        });
    });

    it('cannot use strict mode and parsedMethods options at the same time', async () => {
      let err;
      try {
        app.use(koaBody({
          parsedMethods: ['POST', 'PUT', 'PATCH'],
          strict: true,
        }));
      } catch (_err) {
        err = _err;
      }

      assert(err && err.message === 'Cannot use strict and parsedMethods options at the same time.');
    });
  });

  /**
   * JSON request body
   */
  describe('POST json request body', async () => {
    it('should set the follower count', async () => {
      app.use(koaBody({ strict: false }));
      app.use(router.routes());

      return request(http.createServer(app.callback()))
        .post('/users')
        .type('application/json')
        .send({
          name: 'json',
          followers: '313',
        })
        .expect(201)
        .then((res) => {
          res.body.user.should.have.properties({ followers: '313', name: 'json' });
        });
    });
  });

  describe('GET json request body', async () => {
    let response;

    beforeEach(async () => {
      app.use(koaBody({ strict: false }));
      app.use(router.routes());
      database.users.push({
        name: 'foo',
        followers: 111,
      });
      return request(http.createServer(app.callback()))
        .get('/users')
        .type('application/json')
        .send({ name: 'foo' })
        .expect(200)
        .then((res) => {
          response = res;
        });
    });

    it('should parse the response body', async () => {
      response.body.should.not.equal(null);
    });

    it('should return the user details', async () => {
      response.body.name.should.equal('foo');
      response.body.followers.should.equal(111);
    });
  });

  const ERR_413_STATUSTEXT = 'request entity too large';

  /**
   * FORM (urlencoded) LIMIT
   */
  it(`should request 413 ${ERR_413_STATUSTEXT}, because of \`formLimit\``, async () => {
    app.use(koaBody({ formLimit: 10 /* bytes */ }));
    app.use(router.routes());

    return request(http.createServer(app.callback()))
      .post('/users')
      .type('application/x-www-form-urlencoded')
      .send('user=www-form-urlencoded')
      .expect(413, ERR_413_STATUSTEXT);
  });


  /**
   * JSON LIMIT
   */
  it(`should request 413 ${ERR_413_STATUSTEXT}, because of \`jsonLimit\``, async () => {
    app.use(koaBody({ jsonLimit: 10 /* bytes */ }));
    app.use(router.routes());

    return request(http.createServer(app.callback()))
      .post('/users')
      .type('application/json')
      .send({ name: 'some-long-name-for-limit' })
      .expect(413, ERR_413_STATUSTEXT);
  });


  it('should tolerate no content type', async () => {
    app.use(koaBody());
    app.use(router.routes());

    return request(http.createServer(app.callback()))
      .post('/users')
      .send('Hello <b>invalid</b> content type')
      .expect(201);
  });


  /**
   * TEXT LIMIT
   */
  it(`should request 413 ${ERR_413_STATUSTEXT}, because of \`textLimit\``, async () => {
    app.use(koaBody({ textLimit: 10 /* bytes */ }));
    app.use(router.routes());

    return request(http.createServer(app.callback()))
      .post('/users')
      .type('text')
      .send('String longer than 10 bytes...')
      .expect(413, ERR_413_STATUSTEXT);
  });
});
