koa-body [![Build Status](https://travis-ci.org/tunnckoCore/koa-better-body.png)](https://travis-ci.org/tunnckoCore/koa-better-body) [![Dependencies Status](https://david-dm.org/tunnckoCore/koa-better-body/status.svg)](https://david-dm.org/tunnckoCore/koa-better-body)
================

KoaJS middleware that patch body (to Koa#req.body or Node#request.body, or bother) and parse body to json/form with co-body.
[koa](https://github.com/koajs/koa) middleware for parsing a request body.
This is a simple wrapper around [co-body](https://github.com/co/co-body). Provides similar functionality to the express's [request body parser](http://expressjs.com/api.html#req.body)

Doesn't support multipart. [Discuss](https://github.com/dlau/koa-body/issues/1)


## Install
```
$ npm install koa-body
```


## Options
Initialize koa-better-body middleware with the given `options`:
- **patchNode** Set the body parameter in the **Node** request object `this.req.body`
  *defauls to false*
- **patchKoa** Set the body parameter in the **Koa** request object `this.request.body`
  *defaults to true*
- **jsonLimit** limits application/json request body, co-body's option
  *defauls to '1mb'*
- **formLimit** limits application/x-www-form-urlencoded request body, co-body's option
  *defauls to '56kb'*
- **encoding** request encoding, co-body's option
  *defauls to 'utf-8'*


## Usage
```js
var app        = require('koa')()
  , betterBody = require('./index');
  
/**
 * By default body is patching to
 * Koa's ctx.request
 */
app.use(betterBody({patchNode: false, jsonLimit: '1kb', formLimit: '1kb'}));

app.use(function *(next){
  var patchKoa  = (this.request.body) ? this.request.body : 'patchKoa=true, by default';
  var patchNode = (this.req.body) ? this.req.body : 'patchNode=false, by default';

  if (this.request.method == 'POST') {
    this.status = 201;
  } else if (this.request.method == 'GET') {
    this.status = 200
  }

  this.body = JSON.stringify({koa: patchKoa, node: patchNode});

  if (this.request.method == 'PUT') {
    this.status = 200;
    this.body = 'resource updated successfully';
  }
  if (this.request.method == 'DELETE') {
    this.status = 204;
    this.body = 'resource deleted successfully';
  }
});

var port = process.env.PORT || 3333;
app.listen(port);
console.log('Koa server start listening to port '+port);
```

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
  }
);
```

## Features
- 14 passing (174ms) tests
- co-body options: jsonLimit, formLimit, encoding
- freedom to choose - patch body to
  * KoaJS Context `this.request.body`
  * NodeJS Context `this.req.body`
- only 1 dependency: `co-body`

## Test, Bench, Example
First run `npm install` before run anything.
```
npm test
npm start
```

## Credit

|[![Daryl Lau](https://avatars2.githubusercontent.com/u/2764274?s=144)](https://github.com/dlau)| [![Charlike Mike Reagent](https://avatars2.githubusercontent.com/u/5038030?s=144)](https://github.com/tunnckoCore)|
|---|---|
|[Daryl Lau](https://github.com/dlau) (creator) | [George Yanev](https://github.com/tunnckoCore) (contrib)|

## LICENSE
The MIT License, 2014 [Daryl Lau](http://weak.io) ([@daryllau](https://twitter.com/tunnckoCore)), [Charlike Mike Reagent](https://github.com/tunnckoCore) ([@tunnckoCore](https://twitter.com/tunnckoCore))