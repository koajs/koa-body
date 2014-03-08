# koa-body

  [koa](https://github.com/koajs/koa) middleware for parsing a request body. This is a simple wrapper around [co-body](https://github.com/visionmedia/co-body). Provides similar functionality to the express's [request body parser](http://expressjs.com/api.html#req.body)

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
  //...
});

```

## Usage with [koa-router](https://github.com/alexmingoia/koa-router)
It's generally better to only parse the body as needed, if using a router that supports middleware composition, we can inject it only for certain routes.
```js
//note the function call
var koa_body = require('koa-body')();

//initialize router 
//...

app.post(
  '/users',
  koa_body,
  function *(next) {
    console.log(this.request.body);
    //...
  }
);
```

# License

  MIT
