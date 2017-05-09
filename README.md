koa-body [![Build Status](https://travis-ci.org/dlau/koa-body.svg?branch=koa2)](https://travis-ci.org/dlau/koa-body) [![Dependencies Status](https://david-dm.org/dlau/koa-body/status.svg)](https://david-dm.org/dlau/koa-body)
================

> A full-featured [`koa`](https://github.com/koajs/koa) body parser middleware. Support `multipart`, `urlencoded` and `json` request bodies. Provides same functionality as Express's bodyParser - [`multer`](https://github.com/expressjs/multer). And all that is wrapped only around
[`co-body`](https://github.com/visionmedia/co-body) and [`formidable`](https://github.com/felixge/node-formidable).

## Install
>Install with [npm](https://github.com/npm/npm)

```
$ npm install koa-body
```

## Legacy Koa1 support
```
$ npm install koa-body@1
```

## Features
- can handle three type requests
  * **multipart/form-data**
  * **application/x-www-urlencoded**
  * **application/json**
- option for patch to Koa or Node, or either
- file uploads
- body, fields and files limiting

## Hello world
```sh
npm install koa
npm install koa-body
nvm install v7.9.0 #Note - koa requires node v7.6.0 for ES2015/async support
```
index.js:
```js
const Koa = require('koa');
const koaBody = require('koa-body');

const app = new Koa();

app.use(koaBody());
app.use(ctx => {
  ctx.body = `Request Body: ${JSON.stringify(ctx.request.body)}`;
});

app.listen(3000);
```

```sh
$ node index.js
$ curl -i http://localhost:3000/users -d "name=test"
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 29
Date: Wed, 03 May 2017 02:09:44 GMT
Connection: keep-alive

Request Body: {"name":"test"}% 
```

**For a more comprehensive example, see** `examples/multipart.js`

## Usage with [koa-router](https://github.com/alexmingoia/koa-router)
> It's generally better to only parse the body as needed, if using a router that supports middleware composition, we can inject it only for certain routes.

```js
const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')();
const koaBody = require('koa-body')();

router.post('/users', koaBody,
  (ctx) => {
    console.log(ctx.request.body);
    // => POST body
    ctx.body = JSON.stringify(ctx.request.body);
  }
);

app.use(router.routes());

app.listen(3000);
console.log('curl -i http://localhost:3000/users -d "name=test"');
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
- `text` **{Boolean}** Parse text bodies, default `true`
- `json` **{Boolean}** Parse json bodies, default `true`
- `formidable` **{Object}** Options to pass to the formidable multipart parser
- `onError` **{Function}** Custom error handle, if throw an error, you can customize the response - onError(error, context), default will throw
- `strict` **{Boolean}** If enabled, don't parse GET, HEAD, DELETE requests, default `true`

## A note about strict mode
> see [http://tools.ietf.org/html/draft-ietf-httpbis-p2-semantics-19#section-6.3](http://tools.ietf.org/html/draft-ietf-httpbis-p2-semantics-19#section-6.3)
- GET, HEAD, and DELETE requests have no defined semantics for the request body, but this doesn't mean they may not be valid in certain use cases.
- koa-body is strict by default

## Some options for formidable
> See [node-formidable](https://github.com/felixge/node-formidable) for a full list of options
- `bytesExpected` **{Integer}** The expected number of bytes in this form, default `null`
- `maxFields` **{Integer}** Limits the number of fields that the querystring parser will decode, default `1000`
- `maxFieldsSize` **{Integer}** Limits the amount of memory all fields together (except files) can allocate in bytes. If this value is exceeded, an 'error' event is emitted, default `2mb (2 * 1024 * 1024)`
- `uploadDir` **{String}** Sets the directory for placing file uploads in, default `os.tmpDir()`
- `keepExtensions` **{Boolean}** Files written to `uploadDir` will include the extensions of the original files, default `false`
- `hash` **{String}** If you want checksums calculated for incoming files, set this to either `'sha1'` or `'md5'`, default `false`
- `multiples` **{Boolean}** Multiple file uploads or no, default `true`
- `onFileBegin` **{Function}** Special callback on file begin. The function is executed directly by formidable. It can be used to rename files before saving them to disk. [See the docs](https://github.com/felixge/node-formidable#filebegin)


**Note**: You can patch request body to Node or Koa in same time if you want.


## Tests
```
$ npm test
```

## License
The MIT License, 2014 [Charlike Mike Reagent](https://github.com/tunnckoCore) ([@tunnckoCore](https://twitter.com/tunnckoCore)) and [Daryl Lau](https://github.com/dlau) ([@daryllau](https://twitter.com/daryllau))
