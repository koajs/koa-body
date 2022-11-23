/*!
 * koa-body <https://github.com/dlau/koa-body>
 * A koa body parser middleware with support for `multipart/form-data`,
 * `application/json` or `application/x-www-form-urlencoded` request bodies.
 *
 * Copyright (c) 2014 Charlike Mike Reagent, Daryl Lau, contributors.
 * Released under the MIT license.
 */
import assert from 'assert';
import fs from 'fs';
import http from 'http';
import koaBody, { HttpMethodEnum } from '../../src/index';
import path from 'path';
import request, { Response } from 'supertest';
import should from 'should';
import Koa from 'koa';
import Router from 'koa-router';
import sinon, { SinonSpy } from 'sinon';

import unparsed from '../../src/unparsed';

describe('koa-body', () => {
  let database: { users: Array<{ name: string; followers?: number }> };
  let router: Router;
  let app: Koa;

  beforeEach((done) => {
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
    router = new Router()
      .get('/users', (ctx, next) => {
        if (ctx.request.body && ctx.request.body.name) {
          ctx.body = database.users.find((element) => element.name === ctx.request.body.name);
          ctx.status = 200;
          return next();
        }
        ctx.status = 200;
        ctx.body = database;
      })
      .get('/users/:user', (ctx) => {
        const user = database.users.find((element) => element.name === ctx.request.body.name);
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
          user: user, // original request data
        };
      })
      .post('/echo_body', (ctx) => {
        ctx.status = 200;
        ctx.body = ctx.request.body;
      })
      .delete('/users/:user', (ctx) => {
        const user = ctx.params.user;
        const multi = !!ctx.request.body.multi;
        if (multi) {
          database.users = database.users.filter((element) => element.name !== user);
        } else {
          // @ts-ignore
          const index = database.users.findIndex((element) => element === user);
          database.users.splice(index, 1);
        }
        ctx.status = 204;
        ctx.body = '';
      });
    done();
  });

  /**
   * DEFAULTS - multipart: false
   */
  it('should work with defaults - multipart: false, only `urlencoded` and `json` bodies', (done) => {
    app.use(koaBody());
    app.use(router.routes());

    request(http.createServer(app.callback()))
      .get('/users')
      .expect(200, database)
      .end((err) => {
        if (err) return done(err);
        done();
      });
  });

  /**
   * MULTIPART - FIELDS
   */
  it('should receive `multipart` requests - fields on .body object', (done) => {
    app.use(koaBody({ multipart: true }));
    app.use(router.routes());

    request(http.createServer(app.callback()))
      .post('/users')
      .field('name', 'daryl')
      .field('followers', 30)
      .expect(201)
      .end((err, res) => {
        if (err) return done(err);

        const mostRecentUser = database.users[database.users.length - 1];

        res.body.user.should.have.property('name', mostRecentUser.name);
        res.body.user.should.have.property('followers', mostRecentUser.followers);

        res.body.user.should.have.property('name', 'daryl');
        res.body.user.should.have.property('followers', '30');

        done();
      });
  });

  /**
   * MULTIPART - FILES
   */
  it('should receive multiple fields and files via `multipart` on .body.files object', (done) => {
    app.use(
      koaBody({
        multipart: true,
        formidable: {
          uploadDir: '/tmp',
        },
      }),
    );
    app.use(router.routes());

    request(http.createServer(app.callback()))
      .post('/users')
      .type('multipart/form-data')
      .field('names', 'John')
      .field('names', 'Paul')
      .attach('firstField', 'package.json')
      .attach('secondField', 'src/index.ts')
      .attach('secondField', 'package.json')
      .attach('thirdField', 'LICENSE')
      .attach('thirdField', 'README.md')
      .attach('thirdField', 'package.json')
      .expect(201)
      .end((err, res) => {
        if (err) return done(err);
        res.body.user.names.should.be.an.Array().and.have.lengthOf(2);
        res.body.user.names[0].should.equal('John');
        res.body.user.names[1].should.equal('Paul');
        res.body._files.firstField.should.be.an.Object();
        res.body._files.firstField.originalFilename.should.equal('package.json');
        should(fs.statSync(res.body._files.firstField.filepath)).be.ok();
        fs.unlinkSync(res.body._files.firstField.filepath);

        res.body._files.secondField.should.be.an.Array().and.have.lengthOf(2);
        res.body._files.secondField.should.containDeep([
          {
            originalFilename: 'index.ts',
          },
        ]);
        res.body._files.secondField.should.containDeep([
          {
            originalFilename: 'package.json',
          },
        ]);
        should(fs.statSync(res.body._files.secondField[0].filepath)).be.ok();
        should(fs.statSync(res.body._files.secondField[1].filepath)).be.ok();
        fs.unlinkSync(res.body._files.secondField[0].filepath);
        fs.unlinkSync(res.body._files.secondField[1].filepath);

        res.body._files.thirdField.should.be.an.Array().and.have.lengthOf(3);

        res.body._files.thirdField.should.containDeep([
          {
            originalFilename: 'LICENSE',
          },
        ]);
        res.body._files.thirdField.should.containDeep([
          {
            originalFilename: 'README.md',
          },
        ]);
        res.body._files.thirdField.should.containDeep([
          {
            originalFilename: 'package.json',
          },
        ]);
        should(fs.statSync(res.body._files.thirdField[0].filepath)).be.ok();
        fs.unlinkSync(res.body._files.thirdField[0].filepath);
        should(fs.statSync(res.body._files.thirdField[1].filepath)).be.ok();
        fs.unlinkSync(res.body._files.thirdField[1].filepath);
        should(fs.statSync(res.body._files.thirdField[2].filepath)).be.ok();
        fs.unlinkSync(res.body._files.thirdField[2].filepath);

        done();
      });
  });

  it('can transform file names in multipart requests', (done) => {
    app.use(
      koaBody({
        multipart: true,
        formidable: {
          uploadDir: '/tmp',
          onFileBegin: (_name, file) => {
            file.newFilename = 'backage.json';
            const folder = path.dirname(file.filepath);
            file.filepath = path.join(folder, file.newFilename);
          },
        },
      }),
    );
    app.use(router.routes());

    request(http.createServer(app.callback()))
      .post('/users')
      .type('multipart/form-data')
      .attach('firstField', 'package.json')
      .expect(201)
      .end((err, res) => {
        if (err) return done(err);

        res.body._files.firstField.should.be.an.Object();
        res.body._files.firstField.newFilename.should.equal('backage.json');
        should(fs.statSync(res.body._files.firstField.filepath)).be.ok();
        fs.unlinkSync(res.body._files.firstField.filepath);

        done();
      });
  });

  /**
   * URLENCODED request body
   */
  it('should receive `urlencoded` request bodies', (done) => {
    app.use(koaBody({ multipart: true }));
    app.use(router.routes());

    request(http.createServer(app.callback()))
      .post('/users')
      .type('application/x-www-form-urlencoded')
      .send({
        name: 'example',
        followers: '41',
      })
      .expect(201)
      .end((err, res) => {
        if (err) return done(err);

        const mostRecentUser = database.users[database.users.length - 1];

        res.body.user.should.have.properties(mostRecentUser);
        res.body.user.should.have.properties({ name: 'example', followers: '41' });

        done();
      });
  });

  /**
   * Inclusion of unparsed body when opts.includeUnparsed is true
   */
  describe('includeUnparsed tests', () => {
    let requestSpy: SinonSpy | undefined;

    beforeEach(() => {
      app.use(koaBody({ includeUnparsed: true }));
      app.use(router.routes());
    });

    afterEach(() => {
      requestSpy?.restore();
      requestSpy = undefined;
    });

    it('should not fail when no request body is provided', (done) => {
      const echoRouterLayer = router.stack.filter((layer) => layer.path === '/echo_body');
      // @ts-ignore
      requestSpy = sinon.spy(echoRouterLayer[0].stack, '0');

      request(http.createServer(app.callback()))
        .post('/echo_body')
        .type('application/json')
        .send(undefined)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          assert(requestSpy?.calledOnce, 'Spy for /echo_body not called');
          const req = requestSpy?.firstCall.args[0].request;

          req.body.should.not.be.Undefined();
          res.body.should.have.properties({});

          req.body[unparsed].should.not.be.Undefined();
          req.body[unparsed].should.be.a.String();
          req.body[unparsed].should.have.length(0);

          done();
        });
    });

    it('should receive `urlencoded` request bodies with the `includeUnparsed` option', (done) => {
      const userRouterLayer = router.stack.filter(
        (layer) => layer.path === '/users' && layer.methods.includes('POST'),
      );
      // @ts-ignore
      requestSpy = sinon.spy(userRouterLayer[0].stack, '0');

      request(http.createServer(app.callback()))
        .post('/users')
        .type('application/x-www-form-urlencoded')
        .send({
          name: 'Test',
          followers: '97',
        })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);

          const mostRecentUser = database.users[database.users.length - 1];

          assert(requestSpy?.calledOnce, 'Spy for /users not called');
          const req = requestSpy?.firstCall.args[0].request;
          req.body[unparsed].should.not.be.Undefined();
          req.body[unparsed].should.be.a.String();
          req.body[unparsed].should.equal('name=Test&followers=97');

          res.body.user.should.have.properties({ name: 'Test', followers: '97' });
          res.body.user.should.have.properties(mostRecentUser);
          done();
        });
    });

    it('should receive JSON request bodies as strings with the `includeUnparsed` option', (done) => {
      const echoRouterLayer = router.stack.filter((layer) => layer.path === '/echo_body');
      // @ts-ignore
      requestSpy = sinon.spy(echoRouterLayer[0].stack, '0');

      request(http.createServer(app.callback()))
        .post('/echo_body')
        .type('application/json')
        .send({
          hello: 'world',
          number: 42,
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          assert(requestSpy?.calledOnce, 'Spy for /echo_body not called');
          const req = requestSpy?.firstCall.args[0].request;
          req.body[unparsed].should.not.be.Undefined();
          req.body[unparsed].should.be.a.String();
          req.body[unparsed].should.equal(
            JSON.stringify({
              hello: 'world',
              number: 42,
            }),
          );

          res.body.should.have.properties({ hello: 'world', number: 42 });

          done();
        });
    });

    it('should receive text as strings with `includeUnparsed` option', (done) => {
      const echoRouterLayer = router.stack.filter((layer) => layer.path === '/echo_body');
      // @ts-ignore
      requestSpy = sinon.spy(echoRouterLayer[0].stack, '0');

      request(http.createServer(app.callback()))
        .post('/echo_body')
        .type('text')
        .send('plain text content')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);

          assert(requestSpy?.calledOnce, 'Spy for /echo_body not called');
          const req = requestSpy?.firstCall.args[0].request;
          should(req.body).equal('plain text content');

          // Raw text requests are still just text
          assert.equal(req.body[unparsed], undefined);

          // Text response is just text
          should(res.body).have.properties({});
          should(res.text).equal('plain text content');

          done();
        });
    });
  });

  /**
   * TEXT request body
   */
  it('should receive `text` request bodies', (done) => {
    app.use(koaBody({ multipart: true }));
    app.use(router.routes());

    request(http.createServer(app.callback()))
      .post('/echo_body')
      .type('text')
      .send('plain text')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        res.type.should.equal('text/plain');
        res.text.should.equal('plain text');

        done();
      });
  });

  it('should receive raw XML with `text` request bodies', (done) => {
    app.use(koaBody({ text: true, includeUnparsed: true }));
    app.use(router.routes());
    const body = '<?xml version="1.0"?><catalog></catalog>';

    const echoRouterLayer = router.stack.filter((layer) => layer.path === '/echo_body');
    // @ts-ignore
    const requestSpy = sinon.spy(echoRouterLayer[0].stack, '0');

    request(http.createServer(app.callback()))
      .post('/echo_body')
      .type('text/xml')
      .send(body)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);

        assert(requestSpy?.calledOnce, 'Spy for /echo_body not called');
        const req = requestSpy?.firstCall.args[0].request;
        assert.equal(req.body[unparsed], undefined);
        req.body.should.equal(body);
        res.text.should.equal(body);

        done();
      });
  });

  describe('parsedMethods options', () => {
    beforeEach(() => {
      //push an additional, to test the multi query
      database.users.push({ name: 'charlike' });
    });

    it('methods declared are parsed', (done) => {
      app.use(
        koaBody({
          parsedMethods: [
            HttpMethodEnum.PATCH,
            HttpMethodEnum.POST,
            HttpMethodEnum.PUT,
            HttpMethodEnum.DELETE,
          ],
        }),
      );
      app.use(router.routes());

      request(http.createServer(app.callback()))
        .delete('/users/charlike')
        .type('application/x-www-form-urlencoded')
        .send({ multi: true })
        .expect(204)
        .end((err) => {
          if (err) return done(err);
          assert(database.users.find((element) => element.name === 'charlike') === undefined);
          done();
        });
    });

    it('methods do not get parsed if not declared', (done) => {
      app.use(
        koaBody({ parsedMethods: [HttpMethodEnum.POST, HttpMethodEnum.PUT, HttpMethodEnum.PATCH] }),
      );
      app.use(router.routes());

      request(http.createServer(app.callback()))
        .delete('/users/charlike')
        .type('application/x-www-form-urlencoded')
        .send({ multi: true })
        .expect(204)
        .end((err) => {
          if (err) return done(err);
          assert(database.users.find((element) => element.name === 'charlike') !== undefined);
          done();
        });
    });
  });

  /**
   * JSON request body
   */
  describe('POST json request body', () => {
    it('should set the follower count', (done) => {
      app.use(koaBody());
      app.use(router.routes());

      request(http.createServer(app.callback()))
        .post('/users')
        .type('application/json')
        .send({
          name: 'json',
          followers: '313',
        })
        .expect(201)
        .end((err, res) => {
          res.body.user.should.have.properties({ followers: '313', name: 'json' });
          done(err);
        });
    });
  });

  describe('GET json request body', () => {
    let response: Response;

    beforeEach((done) => {
      app.use(
        koaBody({
          parsedMethods: [HttpMethodEnum.GET],
        }),
      );
      app.use(router.routes());
      database.users.push({
        name: 'foo',
        followers: 111,
      });
      request(http.createServer(app.callback()))
        .get('/users')
        .type('application/json')
        .send({ name: 'foo' })
        .expect(200)
        .end((err, res) => {
          response = res;
          done(err);
        });
    });

    it('should parse the response body', () => {
      response.body.should.not.equal(null);
    });

    it('should return the user details', () => {
      response.body.name.should.equal('foo');
      response.body.followers.should.equal(111);
    });
  });

  describe('JSON media types', () => {
    const types = [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',

      // NOTE: application/csp-report is not supported by superagent
      // See https://github.com/visionmedia/superagent/issues/1482
      // 'application/csp-report'
    ];

    for (const type of types) {
      it(`should decode body as JSON object for type ${type}`, (done) => {
        app.use(koaBody());
        app.use(router.routes());

        request(http.createServer(app.callback()))
          .post('/echo_body')
          .type(type)
          .send({
            a: 'foo',
            b: [42],
          })
          .expect(
            200,
            {
              a: 'foo',
              b: [42],
            },
            done,
          );
      });
    }

    for (const type of types) {
      it(`should decode body as JSON array for type ${type}`, (done) => {
        app.use(koaBody());
        app.use(router.routes());

        request(http.createServer(app.callback()))
          .post('/echo_body')
          .type(type)
          .send([
            {
              a: 'foo',
              b: [42],
            },
          ])
          .expect(
            200,
            [
              {
                a: 'foo',
                b: [42],
              },
            ],
            done,
          );
      });
    }
  });

  const ERR_413_STATUSTEXT = 'request entity too large';

  /**
   * FORM (urlencoded) LIMIT
   */
  it('should request 413 ' + ERR_413_STATUSTEXT + ', because of `formLimit`', (done) => {
    app.use(koaBody({ formLimit: 10 /*bytes*/ }));
    app.use(router.routes());

    request(http.createServer(app.callback()))
      .post('/users')
      .type('application/x-www-form-urlencoded')
      .send('user=www-form-urlencoded')
      .expect(413, ERR_413_STATUSTEXT)
      .end(done);
  });

  /**
   * JSON LIMIT
   */
  it('should request 413 ' + ERR_413_STATUSTEXT + ', because of `jsonLimit`', (done) => {
    app.use(koaBody({ jsonLimit: 10 /*bytes*/ }));
    app.use(router.routes());

    request(http.createServer(app.callback()))
      .post('/users')
      .type('application/json')
      .send({ name: 'some-long-name-for-limit' })
      .expect(413, ERR_413_STATUSTEXT)
      .end(done);
  });

  it('should tolerate no content type', (done) => {
    app.use(koaBody());
    app.use(router.routes());

    request(http.createServer(app.callback()))
      .post('/users')
      .send('Hello <b>invalid</b> content type')
      .expect(201)
      .end(done);
  });

  /**
   * TEXT LIMIT
   */
  it('should request 413 ' + ERR_413_STATUSTEXT + ', because of `textLimit`', (done) => {
    app.use(koaBody({ textLimit: 10 /*bytes*/ }));
    app.use(router.routes());

    request(http.createServer(app.callback()))
      .post('/users')
      .type('text')
      .send('String longer than 10 bytes...')
      .expect(413, ERR_413_STATUSTEXT)
      .end(done);
  });
});
