
# koa-body

  [koa](https://github.com/koajs/koa) middleware for parsing a request body. This is a simple wrapper around [co-body](https://github.com/co/co-body). Provides similar functionality to the express's [request body parser](http://expressjs.com/api.html#req.body)

  Doesn't support multipart

## Installation

```
$ npm install koa-body
```

## Options

- patchNode 
  Set the body parameter in the node request object `this.req.body`
  *defauls to false*
- patchKoa
  Set the body parameter in the koa request object `this.request.body`
  *defaults to true*

## Example

```js
var koa = require('koa');
var koa_body = require('koa-body');
var app = koa();

app.use(koa_body());

app.use(function *(){
  console.log(this.request.body);
});

```

# License

  MIT
