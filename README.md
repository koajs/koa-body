# koa-body

[![CI](https://github.com/koajs/koa-body/actions/workflows/ci.yaml/badge.svg)](https://github.com/koajs/koa-body/actions/workflows/ci.yaml)
[![KoaJs Slack](https://img.shields.io/badge/Koa.Js-Slack%20Channel-Slack.svg?longCache=true)](https://communityinviter.com/apps/koa-js/koajs)

---

> A full-featured [`koa`](https://github.com/koajs/koa) body parser middleware. Supports `multipart`, `urlencoded`, and `json` request bodies. Provides the same functionality as Express's bodyParser - [`multer`](https://github.com/expressjs/multer).

## Install

> Install with [npm](https://github.com/npm/npm)

```
npm install koa-body
```

## Features

- can handle requests such as:
  - **multipart/form-data**
  - **application/x-www-form-urlencoded**
  - **application/json**
  - **application/json-patch+json**
  - **application/vnd.api+json**
  - **application/csp-report**
  - **text/xml**
- option for patch to Koa or Node, or either
- file uploads
- body, fields and files size limiting

## Hello World - Quickstart

```sh
npm install koa koa-body # Note that Koa requires Node.js 7.6.0+ for async/await support
```

index.js:

```js
const Koa = require('koa');
const { koaBody } = require('koa-body');

const app = new Koa();

app.use(koaBody());
app.use((ctx) => {
  ctx.body = `Request Body: ${JSON.stringify(ctx.request.body)}`;
});

app.listen(3000);
```

```sh
node index.js
curl -i http://localhost:3000/users -d "name=test"
```

Output:

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 29
Date: Wed, 03 May 2017 02:09:44 GMT
Connection: keep-alive

Request Body: {"name":"test"}%
```

**For a more comprehensive example, see** `examples/multipart.js`

## Usage with [koa-router](https://github.com/alexmingoia/koa-router)

It's generally better to only parse the body as needed, if using a router that supports middleware composition, we can inject it only for certain routes.

```js
const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')();
const { koaBody } = require('koa-body');

router.post('/users', koaBody(), (ctx) => {
  console.log(ctx.request.body);
  // => POST body
  ctx.body = JSON.stringify(ctx.request.body);
});

app.use(router.routes());

app.listen(3000);
console.log('curl -i http://localhost:3000/users -d "name=test"');
```

## Usage with unsupported text body type

For unsupported text body type, for example, `text/xml`, you can use the unparsed request body at `ctx.request.body`. For the text content type, the `includeUnparsed` setting is not required.

```js
// xml-parse.js:
const Koa = require('koa');
const { koaBody } = require('koa-body');
const convert = require('xml-js');

const app = new Koa();

app.use(koaBody());
app.use((ctx) => {
  const obj = convert.xml2js(ctx.request.body);
  ctx.body = `Request Body: ${JSON.stringify(obj)}`;
});

app.listen(3000);
```

```sh
node xml-parse.js
curl -i http://localhost:3000/users -H "Content-Type: text/xml" -d '<?xml version="1.0"?><catalog id="1"></catalog>'
```

Output:

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 135
Date: Tue, 09 Jun 2020 11:17:38 GMT
Connection: keep-alive

Request Body: {"declaration":{"attributes":{"version":"1.0"}},"elements":[{"type":"element","name":"catalog","attributes":{"id":"1"}}]}%
```

## Options

> Options available for `koa-body`. Four custom options, and others are from `raw-body` and `formidable`.

- `patchNode` **{Boolean}** Patch request body to Node's `ctx.req`, default `false`
- `patchKoa` **{Boolean}** Patch request body to Koa's `ctx.request`, default `true`
- `jsonLimit` **{String|Integer}** The byte (if integer) limit of the JSON body, default `1mb`
- `formLimit` **{String|Integer}** The byte (if integer) limit of the form body, default `56kb`
- `textLimit` **{String|Integer}** The byte (if integer) limit of the text body, default `56kb`
- `encoding` **{String}** Sets encoding for incoming form fields, default `utf-8`
- `multipart` **{Boolean}** Parse multipart bodies, default `false`
- `urlencoded` **{Boolean}** Parse urlencoded bodies, default `true`
- `text` **{Boolean}** Parse text bodies, such as XML, default `true`
- `json` **{Boolean}** Parse JSON bodies, default `true`
- `jsonStrict` **{Boolean}** Toggles co-body strict mode; if set to true - only parses arrays or objects, default `true`
- `includeUnparsed` **{Boolean}** Toggles co-body returnRawBody option; if set to true, for form encoded and JSON requests the raw, unparsed request body will be attached to `ctx.request.body` using a `Symbol` ([see details](#a-note-about-unparsed-request-bodies)), default `false`
- `formidable` **{Object}** Options to pass to the formidable multipart parser
- `onError` **{Function}** Custom error handle, if throw an error, you can customize the response - onError(error, context), default will throw
- `parsedMethods` **{String[]}** Declares the HTTP methods where bodies will be parsed, default `['POST', 'PUT', 'PATCH']`. Replaces `strict` option.
- `setEmptyBody` **{Boolean}** When the `content-type` header value does not match a supported type, if an empty body value should be set, default `false`

## A note about `parsedMethods`

> see [http://tools.ietf.org/html/draft-ietf-httpbis-p2-semantics-19#section-6.3](http://tools.ietf.org/html/draft-ietf-httpbis-p2-semantics-19#section-6.3)

- `GET`, `HEAD`, and `DELETE` requests have no defined semantics for the request body, but this doesn't mean they may not be valid in certain use cases.
- koa-body is strict by default, parsing only `POST`, `PUT`, and `PATCH` requests
- you may use either the enumeration or strings to chose which methods to parse: For example, `HttpMethodEnum.PATCH`

## File Support

Uploaded files are accessible via `ctx.request.files`.

## A note about unparsed request bodies

Some applications require cryptographic verification of request bodies, for example webhooks from slack or stripe. The unparsed body can be accessed if `includeUnparsed` is `true` in koa-body's options. When enabled, import the symbol for accessing the request body from `unparsed = require('koa-body/unparsed.js')`, or define your own accessor using `unparsed = Symbol.for('unparsedBody')`. Then the unparsed body is available using `ctx.request.body[unparsed]`.

## Some options for formidable

> See [node-formidable](https://github.com/felixge/node-formidable) for a full list of options

- `maxFields` **{Integer}** Limits the number of fields that the querystring parser will decode, default `1000`
- `maxFieldsSize` **{Integer}** Limits the amount of memory all fields together (except files) can allocate in bytes. If this value is exceeded, an 'error' event is emitted, default `2mb (2 * 1024 * 1024)`
- `uploadDir` **{String}** Sets the directory for placing file uploads in, default `os.tmpDir()`
- `keepExtensions` **{Boolean}** Files written to `uploadDir` will include the extensions of the original files, default `false`
- `hashAlgorithm` **{String}** If you want checksums calculated for incoming files, set this to either `'sha1'` or `'md5'`, default `false`
- `multiples` **{Boolean}** Multiple file uploads or no, default `true`
- `onFileBegin` **{Function}** Special callback on file begin. The function is executed directly by formidable. It can be used to rename files before saving them to disk. [See the docs](https://github.com/felixge/node-formidable#filebegin)

## Changelog

Please see the [Changelog](./CHANGELOG.md) for a summary of changes.

## Tests

```
$ npm test
```

## License

The MIT License, 2014 [Charlike Mike Reagent](https://github.com/tunnckoCore) ([@tunnckoCore](https://twitter.com/tunnckoCore)) and [Daryl Lau](https://github.com/dlau) ([@daryllau](https://twitter.com/daryllau))
