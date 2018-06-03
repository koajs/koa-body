/**
 * koa-body - example.js
 * Copyright(c) 2014
 * MIT Licensed
 *
 * @author  Charlike Mike Reagent (@tunnckoCore)
 * @author  Daryl Lau (@dlau)
 * @api private
 */
var Koa       = require('koa'),
    app       = new Koa(),
    router    = require('koa-router')(),
    koaBody   = require('../index')({multipart:true});

router.post('/users', koaBody,
  (ctx) => {
    console.log(ctx.request.body);
    // => POST body
    ctx.body = JSON.stringify(ctx.request.body, null, 2);
  }
);

router.get('/', (ctx) => {
  ctx.set('Content-Type', 'text/html');
  ctx.body = `
<!doctype html>
<html>
  <body>
    <form action="/" enctype="multipart/form-data" method="post">
    <input type="text" name="username" placeholder="username"><br>
    <input type="text" name="title" placeholder="tile of film"><br>
    <input type="file" name="uploads" multiple="multiple"><br>
    <button type="submit">Upload</button>
  </body>
</html>`;
});

router.post('/', koaBody,
  (ctx) => {
    console.log('fields: ', ctx.request.fields);
    // => {username: ""} - if empty

    console.log('files: ', ctx.request.files);
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
    ctx.body = JSON.stringify(ctx.request.body, null, 2);
  }
)

app.use(router.routes());

var port = process.env.PORT || 3333;
app.listen(port);
console.log('Koa server with `koa-body` parser start listening to port %s', port);
console.log('curl -i http://localhost:%s/users -d "user=admin"', port);
console.log('curl -i http://localhost:%s/ -F "source=@/path/to/file.png"', port);
