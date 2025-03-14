import assert from 'node:assert';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import Router from '@koa/router';
import type { File } from 'formidable';
import Koa from 'koa';
import request, { type Response } from 'supertest';
import koaBody, { HttpMethodEnum } from './index.js';

import { beforeEach, describe, it, mock } from 'node:test';
import { z } from 'zod';

describe('koa-body', () => {
  let database: { users: Array<{ name: string; followers?: number }> };
  let router: Router;
  let app: Koa;

  beforeEach(() => {
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
        const schema = z.object({ name: z.string() });
        const user = schema.safeParse(ctx.request.body);
        if (user.success) {
          ctx.body = database.users.find((element) => element.name === user.data.name);
          ctx.status = 200;
          return next();
        }
        ctx.status = 200;
        ctx.body = database;
      })
      .get('/users/:user', (ctx) => {
        const user = database.users.find((element) => element.name === ctx.params.user);
        ctx.status = 200;
        ctx.body = user;
      })
      .post('/users', (ctx, next) => {
        const schema = z.union([
          z.object({ name: z.string(), followers: z.coerce.number() }),
          z.object({ names: z.array(z.string()) }),
          z.object({}),
        ]);
        const body = schema.safeParse(ctx.request.body);

        if (body.error) {
          ctx.status = 400;
          return next();
        }

        if (body.data && 'name' in body.data) {
          database.users.push(body.data);
        }
        ctx.status = 201;

        // return request contents to validate
        ctx.body = {
          _files: ctx.request.files, // files we populate
          user: ctx.request.body, // original request data
        };
      })
      .post('/echo_body', (ctx) => {
        ctx.status = 200;
        ctx.body = ctx.request.body;
      })
      .delete('/users/:user', (ctx) => {
        const user = ctx.params.user;
        const schema = z.object({ multi: z.coerce.boolean().optional() });

        const body = schema.safeParse(ctx.request.body);
        if (body.success) {
          if (body.data.multi) {
            database.users = database.users.filter((element) => element.name !== user);
          } else {
            const index = database.users.findIndex((element) => element.name === user);
            database.users.splice(index, 1);
          }
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

    const response = await request(http.createServer(app.callback())).get('/users');
    assert.strictEqual(response.status, 200);
    assert.deepEqual(response.body, database);
  });

  /**
   * MULTIPART - FIELDS
   */
  it('should receive `multipart` requests - fields on .body object', async () => {
    app.use(koaBody({ multipart: true }));
    app.use(router.routes());

    const response = await request(http.createServer(app.callback()))
      .post('/users')
      .field('name', 'daryl')
      .field('followers', 30);

    const mostRecentUser = database.users[database.users.length - 1];

    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.body.user.name, mostRecentUser.name);
    assert.strictEqual(response.body.user.followers, mostRecentUser.followers?.toString());
    assert.strictEqual(response.body.user.name, 'daryl');
    assert.strictEqual(response.body.user.followers, '30');
  });

  /**
   * MULTIPART - FILES
   */
  it('should receive multiple fields and files via `multipart` on .body.files object', async () => {
    app.use(
      koaBody({
        multipart: true,
        formidable: {
          uploadDir: '/tmp',
        },
      }),
    );
    app.use(router.routes());

    const response = await request(http.createServer(app.callback()))
      .post('/users')
      .type('multipart/form-data')
      .field('names', 'John')
      .field('names', 'Paul')
      .attach('firstField', 'package.json')
      .attach('secondField', 'src/index.ts')
      .attach('secondField', 'package.json')
      .attach('thirdField', 'LICENSE')
      .attach('thirdField', 'README.md')
      .attach('thirdField', 'package.json');
    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.body.user.names.length, 2);
    assert.strictEqual(response.body.user.names[0], 'John');
    assert.strictEqual(response.body.user.names[1], 'Paul');
    assert.strictEqual(typeof response.body._files.firstField, 'object');
    assert.strictEqual(response.body._files.firstField.originalFilename, 'package.json');
    assert.ok(fs.statSync(response.body._files.firstField.filepath));

    fs.unlinkSync(response.body._files.firstField.filepath);
    assert.ok(Array.isArray(response.body._files.secondField));
    assert.strictEqual(response.body._files.secondField.length, 2);
    assert.ok(
      response.body._files.secondField.some((file: File) => file.originalFilename === 'index.ts'),
    );
    assert.ok(
      response.body._files.secondField.some(
        (file: File) => file.originalFilename === 'package.json',
      ),
    );

    assert.ok(fs.statSync(response.body._files.secondField[0].filepath));
    assert.ok(fs.statSync(response.body._files.secondField[1].filepath));

    fs.unlinkSync(response.body._files.secondField[0].filepath);
    fs.unlinkSync(response.body._files.secondField[1].filepath);

    assert.ok(Array.isArray(response.body._files.thirdField));
    assert.strictEqual(response.body._files.thirdField.length, 3);
    assert.ok(
      response.body._files.thirdField.some((file: File) => file.originalFilename === 'LICENSE'),
    );
    assert.ok(
      response.body._files.thirdField.some((file: File) => file.originalFilename === 'README.md'),
    );
    assert.ok(
      response.body._files.thirdField.some(
        (file: File) => file.originalFilename === 'package.json',
      ),
    );

    assert.ok(fs.statSync(response.body._files.thirdField[0].filepath));
    assert.ok(fs.statSync(response.body._files.thirdField[1].filepath));
    assert.ok(fs.statSync(response.body._files.thirdField[2].filepath));

    fs.unlinkSync(response.body._files.thirdField[0].filepath);
    fs.unlinkSync(response.body._files.thirdField[1].filepath);
    fs.unlinkSync(response.body._files.thirdField[2].filepath);
  });

  it('can transform file names in multipart requests', async () => {
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

    const response = await request(http.createServer(app.callback()))
      .post('/users')
      .type('multipart/form-data')
      .attach('firstField', 'package.json');

    assert.strictEqual(response.status, 201);
    assert.strictEqual(typeof response.body._files.firstField, 'object');
    assert.strictEqual(response.body._files.firstField.newFilename, 'backage.json');
    assert.ok(fs.statSync(response.body._files.firstField.filepath));
    fs.unlinkSync(response.body._files.firstField.filepath);
  });

  /**
   * URLENCODED request body
   */
  it('should recieve `urlencoded` request bodies', async () => {
    app.use(koaBody({ multipart: true }));
    app.use(router.routes());

    const respone = await request(http.createServer(app.callback()))
      .post('/users')
      .type('application/x-www-form-urlencoded')
      .send({
        name: 'example',
        followers: '41',
      });
    assert.strictEqual(respone.status, 201);

    const mostRecentUser = database.users[database.users.length - 1];

    assert.deepStrictEqual(respone.body.user.name, mostRecentUser.name);
    assert.deepStrictEqual(respone.body.user.followers, mostRecentUser.followers?.toString());

    const expectedProperties = { name: 'example', followers: '41' };

    assert.deepStrictEqual(respone.body.user, expectedProperties);
  });

  /**
   * Inclusion of unparsed body when opts.includeUnparsed is true
   */
  describe('includeUnparsed tests', () => {
    it('should not fail when no request body is provided', async () => {
      const koaBodyMock = mock.fn(koaBody({ includeUnparsed: true }));
      app.use(koaBodyMock);
      app.use(router.routes());
      const response = await request(http.createServer(app.callback()))
        .post('/echo_body')
        .type('application/json')
        .send(undefined);
      assert.deepEqual(response.status, 200);
      assert.notEqual(response.body, undefined);
      assert.deepEqual(response.body, {});

      assert.notEqual(response.body, undefined);
      assert.strictEqual(koaBodyMock.mock.calls.length, 1);

      const ctx = koaBodyMock.mock.calls[0].arguments[0];
      assert.strictEqual(ctx.request.rawBody, '');
    });

    it('should recieve `urlencoded` request bodies with the `includeUnparsed` option', async () => {
      const koaBodyMock = mock.fn(koaBody({ includeUnparsed: true }));
      app.use(koaBodyMock);
      app.use(router.routes());
      const response = await request(http.createServer(app.callback()))
        .post('/users')
        .type('application/x-www-form-urlencoded')
        .send({
          name: 'Test',
          followers: '97',
        });

      const mostRecentUser = database.users[database.users.length - 1];

      assert.deepEqual(response.status, 201);
      assert.deepEqual(response.body.user, { name: 'Test', followers: '97' });
      assert.deepEqual(response.body.user, mostRecentUser);

      assert.strictEqual(koaBodyMock.mock.calls.length, 1);

      const ctx = koaBodyMock.mock.calls[0].arguments[0];
      assert.strictEqual(ctx.request.rawBody, 'name=Test&followers=97');
    });

    it('should receive JSON request bodies as strings with the `includeUnparsed` option', async () => {
      const koaBodyMock = mock.fn(koaBody({ includeUnparsed: true }));
      app.use(koaBodyMock);
      app.use(router.routes());

      const response = await request(http.createServer(app.callback()))
        .post('/echo_body')
        .type('application/json')
        .send({
          hello: 'world',
          number: 42,
        });
      assert.strictEqual(response.status, 200);

      assert.strictEqual(koaBodyMock.mock.calls.length, 1);

      const ctx = koaBodyMock.mock.calls[0].arguments[0];
      const body = ctx.request.body;

      if (body && typeof body !== 'string') {
        assert.strictEqual(
          ctx.request.rawBody,
          JSON.stringify({
            hello: 'world',
            number: 42,
          }),
        );
        assert.deepEqual(body, { hello: 'world', number: 42 });
      } else {
        assert.fail('Received no body or typeof body was string');
      }
    });

    it('should receive text as strings with `includeUnparsed` option', async () => {
      const koaBodyMock = mock.fn(koaBody({ includeUnparsed: true }));
      app.use(koaBodyMock);
      app.use(router.routes());

      const response = await request(http.createServer(app.callback()))
        .post('/echo_body')
        .type('text')
        .send('plain text content');

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.type, 'text/plain');
      assert.deepEqual(response.body, {});
      assert.strictEqual(response.text, 'plain text content');

      assert.strictEqual(koaBodyMock.mock.calls.length, 1);

      const ctx = koaBodyMock.mock.calls[0].arguments[0];
      const body = ctx.request.body;
      assert.strictEqual(body, 'plain text content');
      assert.strictEqual(ctx.request.rawBody, 'plain text content');
    });
  });

  /**
   * TEXT request body
   */
  it('should recieve `text` request bodies', async () => {
    app.use(koaBody({ multipart: true }));
    app.use(router.routes());

    const response = await request(http.createServer(app.callback()))
      .post('/echo_body')
      .type('text')
      .send('plain text');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.type, 'text/plain');
    assert.strictEqual(response.text, 'plain text');
  });

  it('should recieve raw XML with `text` request bodies', async () => {
    const koaBodyMock = mock.fn(koaBody({ text: true, includeUnparsed: true }));
    app.use(koaBodyMock);
    app.use(router.routes());
    const xml = '<?xml version="1.0"?><catalog></catalog>';

    const response = await request(http.createServer(app.callback()))
      .post('/echo_body')
      .type('text/xml')
      .send(xml);

    assert.strictEqual(response.status, 200);

    assert.strictEqual(koaBodyMock.mock.calls.length, 1);

    const ctx = koaBodyMock.mock.calls[0].arguments[0];
    const body = ctx.request.body;
    assert.strictEqual(body, xml);
    assert.strictEqual(response.text, xml);
    assert.strictEqual(ctx.request.rawBody, xml);
  });

  describe('parsedMethods options', () => {
    beforeEach(() => {
      //push an additional, to test the multi query
      database.users.push({ name: 'charlike' });
    });

    it('methods declared are parsed', async () => {
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

      const respone = await request(http.createServer(app.callback()))
        .delete('/users/charlike')
        .type('application/x-www-form-urlencoded')
        .send({ multi: true });

      assert.strictEqual(respone.status, 204);
      assert.strictEqual(
        database.users.find((element) => element.name === 'charlike'),
        undefined,
      );
    });

    it('methods do not get parsed if not declared', async () => {
      app.use(
        koaBody({ parsedMethods: [HttpMethodEnum.POST, HttpMethodEnum.PUT, HttpMethodEnum.PATCH] }),
      );
      app.use(router.routes());

      const response = await request(http.createServer(app.callback()))
        .delete('/users/charlike')
        .type('application/x-www-form-urlencoded')
        .send({ multi: true });

      assert.strictEqual(response.status, 204);
      assert.notStrictEqual(
        database.users.find((element) => element.name === 'charlike'),
        undefined,
      );
    });
  });

  /**
   * JSON request body
   */
  describe('POST json request body', () => {
    it('should set the follower count', async () => {
      app.use(koaBody());
      app.use(router.routes());

      const response = await request(http.createServer(app.callback()))
        .post('/users')
        .type('application/json')
        .send({
          name: 'json',
          followers: '313',
        });
      assert.strictEqual(response.status, 201);
      assert.deepEqual(response.body.user, { followers: '313', name: 'json' });
    });
  });

  describe('GET json request body', () => {
    let response: Response;

    beforeEach(async () => {
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
      response = await request(http.createServer(app.callback()))
        .get('/users')
        .type('application/json')
        .send({ name: 'foo' });
    });

    it('should parse the response body', () => {
      assert.strictEqual(response.status, 200);
      assert.notStrictEqual(response.body, null);
    });

    it('should return the user details', () => {
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.name, 'foo');
      assert.strictEqual(response.body.followers, 111);
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
      it(`should decode body as JSON object for type ${type}`, async () => {
        app.use(koaBody());
        app.use(router.routes());

        const response = await request(http.createServer(app.callback()))
          .post('/echo_body')
          .type(type)
          .send({
            a: 'foo',
            b: [42],
          });

        assert.strictEqual(response.status, 200);
        assert.deepEqual(response.body, {
          a: 'foo',
          b: [42],
        });
      });
    }

    for (const type of types) {
      it(`should decode body as JSON array for type ${type}`, async () => {
        app.use(koaBody());
        app.use(router.routes());

        const response = await request(http.createServer(app.callback()))
          .post('/echo_body')
          .type(type)
          .send([
            {
              a: 'foo',
              b: [42],
            },
          ]);

        assert.strictEqual(response.status, 200);
        assert.deepEqual(response.body, [
          {
            a: 'foo',
            b: [42],
          },
        ]);
      });
    }
  });

  const ERR_413_STATUSTEXT = 'request entity too large';

  /**
   * FORM (urlencoded) LIMIT
   */
  it(`should request 413 ${ERR_413_STATUSTEXT}, because of \`formLimit\``, async () => {
    app.use(koaBody({ formLimit: 10 /*bytes*/ }));
    app.use(router.routes());

    const response = await request(http.createServer(app.callback()))
      .post('/users')
      .type('application/x-www-form-urlencoded')
      .send('user=www-form-urlencoded');
    assert.strictEqual(response.status, 413);
    assert.strictEqual(response.text, ERR_413_STATUSTEXT);
  });

  /**
   * JSON LIMIT
   */
  it(`should request 413 ${ERR_413_STATUSTEXT}, because of \`jsonLimit\``, async () => {
    app.use(koaBody({ jsonLimit: 10 /*bytes*/ }));
    app.use(router.routes());

    const response = await request(http.createServer(app.callback()))
      .post('/users')
      .type('application/json')
      .send({ name: 'some-long-name-for-limit' });

    assert.strictEqual(response.status, 413);
    assert.strictEqual(response.text, ERR_413_STATUSTEXT);
  });

  it('should tolerate no content type', async () => {
    app.use(koaBody());
    app.use(router.routes());

    const response = await request(http.createServer(app.callback()))
      .post('/users')
      .send('Hello <b>invalid</b> content type');

    assert.strictEqual(response.status, 201);
  });

  /**
   * TEXT LIMIT
   */
  it(`should request 413 ${ERR_413_STATUSTEXT}, because of \`textLimit\``, async () => {
    app.use(koaBody({ textLimit: 10 /*bytes*/ }));
    app.use(router.routes());

    const response = await request(http.createServer(app.callback()))
      .post('/users')
      .type('text')
      .send('String longer than 10 bytes...');

    assert.strictEqual(response.status, 413);
    assert.strictEqual(response.text, ERR_413_STATUSTEXT);
  });
});
