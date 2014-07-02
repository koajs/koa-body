koa-body [![Build Status](https://travis-ci.org/dlau/koa-body.png)](https://travis-ci.org/dlau/koa-body) [![Dependencies Status](https://david-dm.org/dlau/koa-body/status.svg)](https://david-dm.org/dlau/koa-body)
================

> A full-feature [`koa`](https://github.com/koajs/koa) body parser middleware. Support `multipart`, `urlencoded` and `json` request bodies. Provides same functionality as Express's bodyParser - [`multer`](https://github.com/expressjs/multer). And all that is wrapped only around
[`co-body`](https://github.com/visionmedia/co-body) and [`formidable`](https://felixge/node-formidable).
- **Note:** In the npm is one version older. Without `multipart` feature.

## Related module
- [`koa-better-body`](https://github.com/tunnckoCore/koa-better-body) - copy of this, but with better support and publishing to npm.

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
    bulter   = require('./index');

app.use(bulter({uploadDir: __dirname}));
app.use(function *(next) {
  if (this.request.method == 'POST') {
    console.log(this.request.body);
    // => POST body
    this.body = JSON.stringify(this.request.body, null, 2);
  }
  yield next;
});
app.listen(3131)
console.log('curl -i http://localhost:3131/ -d "name=test"');
```

## Usage with [koa-router](https://github.com/alexmingoia/koa-router)
> It's generally better to only parse the body as needed, if using a router that supports middleware composition, we can inject it only for certain routes.

```js
/**
 * koa-body - example.js
 * Copyright(c) 2014
 * MIT Licensed
 *
 * @author  Charlike Mike Reagent (@tunnckoCore)
 * @api private
 */
var app       = require('koa')(),
    router    = require('koa-router'),
    koaBody   = require('./index')(/*defaults*/);
    multiline = require('multiline');

app.use(router(app));

app.post('/users', koaBody,
  function *(next) {
    console.log(this.request.body);
    // => POST body
    this.body = JSON.stringify(this.request.body, null, 2);
    yield next;
  }
);
app.get('/', function *(next) {
  this.set('Content-Type', 'text/html');
  this.body = multiline.stripIndent(function(){/*
      <!doctype html>
      <html>
          <body>
              <form action="/" enctype="multipart/form-data" method="post">
              <input type="text" name="username" placeholder="username"><br>
              <input type="text" name="title" placeholder="tile of film"><br>
              <input type="file" name="uploads" multiple="multiple"><br>
              <button type="submit">Upload</button>
          </body>
      </html>
  */});
});
app.post('/', koaBody,
  function *(next) {
    console.log(this.request.body.fields);
    // => {username: ""} - if empty

    console.log(this.request.body.files);
    /* => {uploads: [
            {
              "size": 748831,
              "path": "/tmp/f7777b4269bf6e64518f96248537c0ab.png",
              "name": "some-image.png",
              "type": "image/png",
              "mtime": "2014-06-17T11:08:52.816Z"
            },
            {
              "size": 379749,
              "path": "/tmp/83b8cf0524529482d2f8b5d0852f49bf.jpeg",
              "name": "nodejs_rulz.jpeg",
              "type": "image/jpeg",
              "mtime": "2014-06-17T11:08:52.830Z"
            }
          ]}
    */
   this.body = JSON.stringify(this.request.body, null, 2)
   yield next;
  }
)

var port = process.env.PORT || 3333;
app.listen(port);
console.log('Koa server with `koa-body` parser start listening to port %s', port);
console.log('curl -i http://localhost:%s/users -d "user=admin"', port);
console.log('curl -i http://localhost:%s/ -F "source=@/path/to/file.png"', port);
```


## Options
> Options available for `koa-body`. Four custom options, and others are from `raw-body` and `formidable`.

- `patchNode` **{Boolean}** Patch request body to Node's `ctx.req`, default `false`
- `patchKoa` **{Boolean}** Patch request body to Koa's `ctx.request`, default `true`
- `jsonLimit` **{String|Integer}** The byte limit of the JSON body, default `1mb`
- `formLimit` **{String|Integer}** The byte limit of the form body, default `56kb`
- `encoding` **{String}** Sets encoding for incoming form fields, default `utf-8`
- `uploadDir` **{String}** Sets the directory for placing file uploads in, default `os.tmpDir()`
- `keepExtensions` **{Boolean}** Files written to `uploadDir` will include the extensions of the original files, default `true`
- `maxFields` **{Integer}** Limits the number of fields that the querystring parser will decode, default `10`
- `maxFieldsSize` **{Integer}** Limits the amount of memory a field (not file) can allocate _in bytes_, default `2mb`
- `hash` **{String}** If you want checksums calculated for incoming files, set this to either `'sha1'` or `'md5'`, default `false`
- `multiples` **{Boolean}** Multiple file uploads or no, default `true`
- `bytesExpected` **{Integer}** The expected number of bytes in this form, default `null`

**Note**: You can patch request body to Node or Koa in same time if you want.


## Test, Bench, Example
> First run `npm install` before run anything.

```
$ npm test
$ npm start
```


## License
The MIT License, 2014 [Charlike Mike Reagent](https://github.com/tunnckoCore) ([@tunnckoCore](https://twitter.com/tunnckoCore)) and [Daryl Lau](https://github.com/dlau) ([@daryllau](https://twitter.com/daryllau))
