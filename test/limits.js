const http = require('http');
const Koa = require('koa');
const request = require('supertest');
const Router = require('koa-router');
const koaBody = require('../index');

const ERR_413_STATUSTEXT = 'request entity too large';

describe('limits', () => {
  let router;
  let app;

  beforeEach(async () => {
    app = new Koa();
    router = Router().post('/users', (ctx) => {
      ctx.status = 200;
    });
  });

  it(`hitting formLimit should respond with 413 ${ERR_413_STATUSTEXT}`, async () => {
    app.use(koaBody({ formLimit: 10 /* bytes */ }));
    app.use(router.routes());

    await request(http.createServer(app.callback()))
      .post('/')
      .type('application/x-www-form-urlencoded')
      .send('user=www-form-urlencoded')
      .expect(413, ERR_413_STATUSTEXT);
  });

  it(`hitting jsonLimit should respond with 413 ${ERR_413_STATUSTEXT}`, async () => {
    app.use(koaBody({ jsonLimit: 10 /* bytes */ }));
    app.use(router.routes());

    await request(http.createServer(app.callback()))
      .post('/')
      .type('application/json')
      .send({ name: 'some-long-name-for-limit' })
      .expect(413, ERR_413_STATUSTEXT);
  });

  it(`hitting textLimit should respond with a 413 ${ERR_413_STATUSTEXT}`, async () => {
    app.use(koaBody({ textLimit: 10 /* bytes */ }));
    app.use(router.routes());

    await request(http.createServer(app.callback()))
      .post('/')
      .type('text')
      .send('String longer than 10 bytes...')
      .expect(413, ERR_413_STATUSTEXT);
  });
});
