koa-body [![Build Status](https://travis-ci.org/dlau/koa-body.png)](https://travis-ci.org/dlau/koa-body) [![Dependencies Status](https://david-dm.org/dlau/koa-body/status.svg)](https://david-dm.org/dlau/koa-body)
================

> A full-feature [`koa`](https://github.com/koajs/koa) body parser middleware. Support `multipart`, `urlencoded` and `json` request bodies. Provides same functionality as Express's bodyParser - [`multer`](https://github.com/expressjs/multer). And all that is wrapped only around
[`co-body`](https://github.com/visionmedia/co-body) and [`formidable`](https://felixge/node-formidable).

## Related module
- [`koa-better-body`](https://github.com/tunnckoCore/koa-better-body)

## Install
>Install with [npm](https://github.com/npm/npm)

```
$ npm install koa-body
```

## Features
- 15 tests
- can handle three type requests
  * **multipart/form-data**
  * **application/x-www-urlencoded**
  * **application/json**
- option for patch to Koa or Node, or either
- file uploads
- body, fields and files limiting
- 2 dependencies only


## Usage like [multer](https://github.com/expressjs/multer)
> It's very simple, because you can access the fields and files in the `ctx.request.body` or `ctx.req.body` JSON object

```js
var app      = require('koa')(),
    koaBody   = require('koa-body');

app.use(koaBody({formidable:{uploadDir: __dirname}}));
app.use(function *(next) {
  if (this.request.method == 'POST') {
    console.log(this.request.body);
    // => POST body
    this.body = JSON.stringify(this.request.body);
  }
  yield next;
});
app.listen(3131)
console.log('curl -i http://localhost:3131/ -d "name=test"');
```
**For a more comprehensive example, see** `examples/multipart.js`

## Usage with [koa-router](https://github.com/alexmingoia/koa-router)
> It's generally better to only parse the body as needed, if using a router that supports middleware composition, we can inject it only for certain routes.

```js
var app     = require('koa')(),
    router  = require('koa-router'),
    koaBody = require('koa-body')();

app.use(router());

app.post('/users', koaBody,
  function *(next) {
    console.log(this.request.body);
    // => POST body
    this.body = JSON.stringify(this.request.body);
  }
);
app.listen(3131)
console.log('curl -i http://localhost:3131/ -d "name=test"');
```


## Options
> Options available for `koa-body`. Four custom options, and others are from `raw-body` and `formidable`.

- `patchNode` **{Boolean}** Patch request body to Node's `ctx.req`, default `false`
- `patchKoa` **{Boolean}** Patch request body to Koa's `ctx.request`, default `true`
- `jsonLimit` **{String|Integer}** The byte limit of the JSON body, default `1mb`
- `formLimit` **{String|Integer}** The byte limit of the form body, default `56kb`
- `encoding` **{String}** Sets encoding for incoming form fields, default `utf-8`
- `multipart` **{Boolean}** Parse multipart bodies, default `false`
- `formidable` **{Object}** Options to pass to the formidable multipart parser
- `strict` **{Boolean}** If enabled, don't parse GET, HEAD, DELETE requests, default `true`

## A note about strict mode
> see [http://tools.ietf.org/html/draft-ietf-httpbis-p2-semantics-19#section-6.3](http://tools.ietf.org/html/draft-ietf-httpbis-p2-semantics-19#section-6.3)
- GET, HEAD, and DELETE requests have no defined semantics for the request body, but this doesn't mean they may not be valid in certain use cases.
- koa-body is strict by default

## Some options for formidable
> See [node-formidable](https://github.com/felixge/node-formidable) for a full list of options
- `bytesExpected` **{Integer}** The expected number of bytes in this form, default `null`
- `maxFields` **{Integer}** Limits the number of fields that the querystring parser will decode, default `10`
- `maxFieldsSize` **{Integer}** Limits the amount of memory a field (not file) can allocate _in bytes_, default `2mb`
- `uploadDir` **{String}** Sets the directory for placing file uploads in, default `os.tmpDir()`
- `keepExtensions` **{Boolean}** Files written to `uploadDir` will include the extensions of the original files, default `true`
- `hash` **{String}** If you want checksums calculated for incoming files, set this to either `'sha1'` or `'md5'`, default `false`
- `multiples` **{Boolean}** Multiple file uploads or no, default `true`


**Note**: You can patch request body to Node or Koa in same time if you want.


## Tests
> As usual - `npm test` **or** if you have [mocha][mocha-url] globally - `mocha --harmony-generators`.

```
$ npm test
```

## License
The MIT License, 2014 [Charlike Mike Reagent](https://github.com/tunnckoCore) ([@tunnckoCore](https://twitter.com/tunnckoCore)) and [Daryl Lau](https://github.com/dlau) ([@daryllau](https://twitter.com/daryllau))
