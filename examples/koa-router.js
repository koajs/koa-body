var log       = console.log,
    Koa       = require('koa'),
    app       = new Koa(),
    router    = require('koa-router')(),
    koaBody   = require('../index'),
    port      = process.env.PORT || 4291
    host      = process.env.HOST || 'http://localhost';

/*!
 * Accepts only urlencoded and json bodies.
 */
router.post('/post/users', koaBody(),
  (ctx) => {
    const body = ctx.request.body;
    log('body', body);
    // => POST body object
    ctx.body = JSON.stringify(body, null, 2);
  }
);

/*!
 * Display HTML page with basic form.
 */
router.get('/', (ctx) => {
  ctx.set('Content-Type', 'text/html');
  ctx.body = `
<!doctype html>
<html>
  <body>
    <form action="/post/upload" enctype="multipart/form-data" method="post">
    <input type="text" name="username" placeholder="username"><br>
    <input type="text" name="title" placeholder="title of file"><br>
    <input type="file" name="uploads" multiple="multiple"><br>
    <button type="submit">Upload</button>
  </body>
</html>`;
});

/*!
 * Accepts `multipart`, `json` and `urlencoded` bodies.
 */
router.post('/post/upload',
  koaBody({
    multipart: true,
    formidable: {
      uploadDir: __dirname + '/uploads'
    }
  }),
  (ctx) => {
    const fields = ctx.request.body.fields;
    const files = ctx.request.files;
    log('fields', fields);
    // => {username: ""} - if empty

    log('files', files);
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

    // respond with the fields and files for example purposes
    ctx.body = JSON.stringify({
      requestFields: fields || null,
      requestFiles: files || null
    }, null, 2)
  }
)

app.use(router.routes());

var port = process.env.PORT || 4291,
    host = process.env.HOST || 'http://localhost';

app.listen(port);

log('Visit %s:%s/ in browser.', host, port);
log();
log('Test with executing this commands:');
log('curl -i %s:%s/post/users -d "user=admin"', host, port);
log('curl -i %s:%s/post/upload -F "source=@%s/avatar.png"', host, port, __dirname);
log();
log('Press CTRL+C to stop...');
