const http = require('http');
const Koa = require('koa');
const request = require('supertest');
const { expect } = require('chai');
const Router = require('koa-router');
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

    const res = await request(http.createServer(app.callback()))
      .post('/echo_body')
      .type('application/json')
      .send(undefined)
      .expect(200);

    expect(requestSpy.calledOnce).to.equal(true, 'Spy for /echo_body not called');
    const req = requestSpy.firstCall.args[0].request;

    expect(res.body).to.eql({});
    expect(req.body[unparsed]).to.equal('');
  });

  it('should recieve `urlencoded` request bodies with the `includeUnparsed` option', async () => {
    const echoRouterLayer = router.stack.find(layer => layer.path === '/echo_body');
    const requestSpy = sinon.spy(echoRouterLayer.stack, '0');

    const res = await request(http.createServer(app.callback()))
      .post('/echo_body')
      .type('application/x-www-form-urlencoded')
      .send({
        name: 'Test',
        followers: '97',
      })
      .expect(200);

    expect(requestSpy.calledOnce).to.equal(true, 'Spy for /echo_body not called');
    const req = requestSpy.firstCall.args[0].request;
    expect(req.body[unparsed]).to.equal('name=Test&followers=97');

    expect(res.body).to.eql({ name: 'Test', followers: '97' });
  });

  it('should receive JSON request bodies as strings with the `includeUnparsed` option', async () => {
    const echoRouterLayer = router.stack.find(layer => layer.path === '/echo_body');
    const requestSpy = sinon.spy(echoRouterLayer.stack, '0');

    const res = await request(http.createServer(app.callback()))
      .post('/echo_body')
      .type('application/json')
      .send({
        hello: 'world',
        number: 42,
      })
      .expect(200);

    expect(requestSpy.calledOnce).to.equal(true, 'Spy for /echo_body not called');
    const req = requestSpy.firstCall.args[0].request;
    expect(req.body[unparsed]).to.eql(JSON.stringify({
      hello: 'world',
      number: 42,
    }));

    expect(res.body).to.eql({ hello: 'world', number: 42 });
  });

  it('should receive text as strings with `includeUnparsed` option', async () => {
    const echoRouterLayer = router.stack.find(layer => layer.path === '/echo_body');
    const requestSpy = sinon.spy(echoRouterLayer.stack, '0');

    const res = await request(http.createServer(app.callback()))
      .post('/echo_body')
      .type('text')
      .send('plain text content')
      .expect(200);

    expect(requestSpy.calledOnce).to.equal(true, 'Spy for /echo_body not called');
    const req = requestSpy.firstCall.args[0].request;
    expect(req.body).to.equal('plain text content');

    // Raw text requests are still just text
    expect(req.body[unparsed]).to.be.an('undefined');

    // Text response is just text
    expect(res.body).eql({});
    expect(res.text).to.equal('plain text content');
  });
});
