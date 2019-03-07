/* eslint-disable no-underscore-dangle */

const fs = require('fs');
const http = require('http');
const path = require('path');
const request = require('supertest');
const should = require('should');
const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('../index');

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

    const res = await request(http.createServer(app.callback()))
      .post('/users')
      .field('name', 'daryl')
      .field('followers', 30)
      .expect(201);

    const mostRecentUser = database.users[database.users.length - 1];

    res.body.user.should.have.property('name', mostRecentUser.name);
    res.body.user.should.have.property('followers', mostRecentUser.followers);

    res.body.user.should.have.property('name', 'daryl');
    res.body.user.should.have.property('followers', '30');
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

    const res = await request(http.createServer(app.callback()))
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
      .expect(201);

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

    const res = await request(http.createServer(app.callback()))
      .post('/users')
      .type('multipart/form-data')
      .field('names', 'John')
      .field('names', 'Paul')
      .attach('firstField', 'package.json')
      .expect(201);
    res.body._files.firstField.should.be.an.Object();
    res.body._files.firstField.name.should.equal('backage.json');
    should(fs.statSync(res.body._files.firstField.path)).be.ok();
    fs.unlinkSync(res.body._files.firstField.path);
  });


  /**
   * URLENCODED request body
   */
  it('should recieve `urlencoded` request bodies', async () => {
    app.use(koaBody({ multipart: true }));
    app.use(router.routes());

    const res = await request(http.createServer(app.callback()))
      .post('/users')
      .type('application/x-www-form-urlencoded')
      .send({
        name: 'example',
        followers: '41',
      })
      .expect(201);
    const mostRecentUser = database.users[database.users.length - 1];

    res.body.user.should.have.properties(mostRecentUser);
    res.body.user.should.have.properties({ name: 'example', followers: '41' });
  });

  /**
   * TEXT request body
   */
  it('should recieve `text` request bodies', async () => {
    app.use(koaBody({ multipart: true }));
    app.use(router.routes());

    const res = await request(http.createServer(app.callback()))
      .post('/echo_body')
      .type('text')
      .send('plain text')
      .expect(200);
    res.type.should.equal('text/plain');
    res.text.should.equal('plain text');
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
          should.notEqual(database.users.find(element => element.name === 'charlike'), undefined);
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
          should.equal(database.users.find(element => element.name === 'charlike'), undefined);
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
          should.equal(database.users.find(element => element.name === 'charlike'), undefined);
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
          should.notEqual(database.users.find(element => element.name === 'charlike'), undefined);
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

      should.equal(err.message, 'Cannot use strict and parsedMethods options at the same time.');
    });
  });

  /**
   * JSON request body
   */
  describe('POST json request body', async () => {
    it('should set the follower count', async () => {
      app.use(koaBody({ strict: false }));
      app.use(router.routes());

      const res = await request(http.createServer(app.callback()))
        .post('/users')
        .type('application/json')
        .send({
          name: 'json',
          followers: '313',
        })
        .expect(201);
      res.body.user.should.have.properties({ followers: '313', name: 'json' });
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
      response = await request(http.createServer(app.callback()))
        .get('/users')
        .type('application/json')
        .send({ name: 'foo' })
        .expect(200);
    });

    it('should parse the response body', async () => {
      response.body.should.not.equal(null);
    });

    it('should return the user details', async () => {
      response.body.name.should.equal('foo');
      response.body.followers.should.equal(111);
    });
  });

  it('should tolerate no content type', async () => {
    app.use(koaBody());
    app.use(router.routes());

    return request(http.createServer(app.callback()))
      .post('/users')
      .send('Hello <b>invalid</b> content type')
      .expect(201);
  });
});
