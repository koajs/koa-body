const http = require('http');
const Koa = require('koa');
const request = require('supertest');
const Router = require('koa-router');
const should = require('should');
const sinon = require('sinon');
const unparsed = require('../unparsed.js');
const koaBody = require('../index');

/**
 * Inclusion of unparsed body when opts.includeUnparsed is true
 */
describe('includeUnparsed tests', async () => {
  let app;
  let router;

  beforeEach(async () => {
    app = new Koa();
    router = Router().post('/echo_body', (ctx) => {
      ctx.status = 200;
      ctx.body = ctx.request.body;
    });
    app.use(koaBody({ includeUnparsed: true }));
    app.use(router.routes());
  });

  it('should not fail when no request body is provided', async () => {
    const echoRouterLayer = router.stack.find(layer => layer.path === '/echo_body');
    const requestSpy = sinon.spy(echoRouterLayer.stack, '0');

    return request(http.createServer(app.callback()))
      .post('/echo_body')
      .type('application/json')
      .send(undefined)
      .expect(200)
      .then((res) => {
        should.equal(requestSpy.calledOnce, true, 'Spy for /echo_body not called');
        const req = requestSpy.firstCall.args[0].request;

        req.body.should.not.be.Undefined();
        res.body.should.deepEqual({});

        req.body[unparsed].should.not.be.Undefined();
        req.body[unparsed].should.be.a.String();
        req.body[unparsed].should.have.length(0);
      });
  });

  it('should recieve `urlencoded` request bodies with the `includeUnparsed` option', async () => {
    const echoRouterLayer = router.stack.find(layer => layer.path === '/echo_body');
    const requestSpy = sinon.spy(echoRouterLayer.stack, '0');

    return request(http.createServer(app.callback()))
      .post('/echo_body')
      .type('application/x-www-form-urlencoded')
      .send({
        name: 'Test',
        followers: '97',
      })
      .expect(200)
      .then((res) => {
        should.equal(requestSpy.calledOnce, true, 'Spy for /echo_body not called');
        const req = requestSpy.firstCall.args[0].request;
        req.body[unparsed].should.not.be.Undefined();
        req.body[unparsed].should.be.a.String();
        req.body[unparsed].should.equal('name=Test&followers=97');

        res.body.should.deepEqual({ name: 'Test', followers: '97' });
      });
  });

  it('should receive JSON request bodies as strings with the `includeUnparsed` option', async () => {
    const echoRouterLayer = router.stack.find(layer => layer.path === '/echo_body');
    const requestSpy = sinon.spy(echoRouterLayer.stack, '0');

    return request(http.createServer(app.callback()))
      .post('/echo_body')
      .type('application/json')
      .send({
        hello: 'world',
        number: 42,
      })
      .expect(200)
      .then((res) => {
        should.equal(requestSpy.calledOnce, true, 'Spy for /echo_body not called');
        const req = requestSpy.firstCall.args[0].request;
        req.body[unparsed].should.not.be.Undefined();
        req.body[unparsed].should.be.a.String();
        req.body[unparsed].should.equal(JSON.stringify({
          hello: 'world',
          number: 42,
        }));

        res.body.should.deepEqual({ hello: 'world', number: 42 });
      });
  });

  it('should receive text as strings with `includeUnparsed` option', async () => {
    const echoRouterLayer = router.stack.find(layer => layer.path === '/echo_body');
    const requestSpy = sinon.spy(echoRouterLayer.stack, '0');

    return request(http.createServer(app.callback()))
      .post('/echo_body')
      .type('text')
      .send('plain text content')
      .expect(200)
      .then((res) => {
        should.equal(requestSpy.calledOnce, true, 'Spy for /echo_body not called');
        const req = requestSpy.firstCall.args[0].request;
        should(req.body).equal('plain text content');

        // Raw text requests are still just text
        should.equal(req.body[unparsed], undefined);

        // Text response is just text
        should(res.body).have.properties({});
        should(res.text).equal('plain text content');
      });
  });
});
