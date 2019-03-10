/* eslint-disable no-underscore-dangle */

const fs = require('fs');
const http = require('http');
const path = require('path');
const request = require('supertest');
const { expect } = require('chai');
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

    await request(http.createServer(app.callback()))
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

    expect(res.body.user).to.eql({
      name: 'daryl',
      followers: '30',
    });

    expect(mostRecentUser).to.eql({
      name: 'daryl',
      followers: '30',
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

    expect(res.body.user.names).to.eql(['John', 'Paul']);

    expect(res.body._files.firstField).to.be.an('object');
    expect(res.body._files.firstField.name).to.equal('package.json');
    expect(fs.statSync(res.body._files.firstField.path)).to.not.be.a('null');
    fs.unlinkSync(res.body._files.firstField.path);

    expect(res.body._files.secondField).to.be.an('array');
    expect(res.body._files.secondField).have.lengthOf(2);

    const fileNames = files => files.map(f => f.name).sort();

    { // start block scope
      const names = fileNames(res.body._files.secondField);
      expect(names).to.eql(['index.js', 'package.json']);

      expect(fs.statSync(res.body._files.secondField[0].path)).to.not.be.a('null');
      expect(fs.statSync(res.body._files.secondField[1].path)).to.not.be.a('null');
      fs.unlinkSync(res.body._files.secondField[0].path);
      fs.unlinkSync(res.body._files.secondField[1].path);
    } // end block scope

    { // start block scope
      const names = fileNames(res.body._files.thirdField);
      expect(names).to.eql(['LICENSE', 'README.md', 'package.json']);

      expect(fs.statSync(res.body._files.thirdField[0].path)).to.not.be.a('null');
      fs.unlinkSync(res.body._files.thirdField[0].path);
      expect(fs.statSync(res.body._files.thirdField[1].path)).to.not.be.a('null');
      fs.unlinkSync(res.body._files.thirdField[1].path);
      expect(fs.statSync(res.body._files.thirdField[2].path)).to.not.be.a('null');
      fs.unlinkSync(res.body._files.thirdField[2].path);
    } // end block scope
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

    expect(res.body._files.firstField).to.be.an('object');
    expect(res.body._files.firstField.name).to.equal('backage.json');
    expect(fs.statSync(res.body._files.firstField.path)).to.not.be.a('null');
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

    expect(res.body.user).to.eql(mostRecentUser);
    expect(res.body.user).to.eql({ name: 'example', followers: '41' });
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
    expect(res.type).to.equal('text/plain');
    expect(res.text).to.equal('plain text');
  });

  describe('strict mode', async () => {
    beforeEach(async () => {
      // push an additional, to test the multi query
      database.users.push({ name: 'charlike' });
    });

    it('can enable strict mode', async () => {
      app.use(koaBody({ strict: true }));
      app.use(router.routes());

      await request(http.createServer(app.callback()))
        .delete('/users/charlike')
        .type('application/x-www-form-urlencoded')
        .send({ multi: true })
        .expect(204);

      expect(database.users.find(element => element.name === 'charlike')).to.not.be.a('undefined');
    });

    it('can disable strict mode', async () => {
      app.use(koaBody({ strict: false }));
      app.use(router.routes());

      await request(http.createServer(app.callback()))
        .delete('/users/charlike')
        .type('application/x-www-form-urlencoded')
        .send({ multi: true })
        .expect(204);

      expect(database.users.find(element => element.name === 'charlike')).to.be.a('undefined');
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

      await request(http.createServer(app.callback()))
        .delete('/users/charlike')
        .type('application/x-www-form-urlencoded')
        .send({ multi: true })
        .expect(204);

      expect(database.users.find(element => element.name === 'charlike')).to.be.a('undefined');
    });

    it('methods do not get parsed if not declared', async () => {
      app.use(koaBody({ parsedMethods: ['POST', 'PUT', 'PATCH'] }));
      app.use(router.routes());

      await request(http.createServer(app.callback()))
        .delete('/users/charlike')
        .type('application/x-www-form-urlencoded')
        .send({ multi: true })
        .expect(204);

      expect(database.users.find(element => element.name === 'charlike')).to.not.be.a('undefined');
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

      expect(err.message).to.equal('Cannot use strict and parsedMethods options at the same time.');
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
      expect(res.body.user).to.eql({ followers: '313', name: 'json' });
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
      expect(response.body).to.not.be.a('null');
    });

    it('should return the user details', async () => {
      expect(response.body).to.eql({
        name: 'foo',
        followers: 111,
      });
    });
  });

  it('should tolerate no content type', async () => {
    app.use(koaBody());
    app.use(router.routes());

    await request(http.createServer(app.callback()))
      .post('/users')
      .send('Hello <b>invalid</b> content type')
      .expect(201);
  });
});
