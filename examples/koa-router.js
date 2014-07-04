var log       = console.log,
    app       = require('koa')(),
    router    = require('koa-router'),
    koaBody   = require('../index'),
    multiline = require('multiline'),
    port      = process.env.PORT || 4291
    host      = process.env.HOST || 'http://localhost';

app.use(router(app));

/*!
 * Accepts only urlencoded and json bodies.
 */
app.post('/post/users', koaBody(),
  function *(next) {
    log(this.request.body);
    // => POST body object
    this.body = JSON.stringify(this.request.body, null, 2);
    yield next;
  }
);

/*!
 * Display HTML page with basic form.
 */
app.get('/', function *(next) {
  this.set('Content-Type', 'text/html');
  this.body = multiline.stripIndent(function(){/*
      <!doctype html>
      <html>
          <body>
              <form action="/post/upload" enctype="multipart/form-data" method="post">
              <input type="text" name="username" placeholder="username"><br>
              <input type="text" name="title" placeholder="title of file"><br>
              <input type="file" name="uploads" multiple="multiple"><br>
              <button type="submit">Upload</button>
          </body>
      </html>
  */});
});

/*!
 * Accepts `multipart`, `json` and `urlencoded` bodies.
 */
app.post('/post/upload',
  koaBody({
    multipart: true,
    formidable: {
      uploadDir: __dirname + '/uploads'
    }
  }),
  function *(next) {
    log(this.request.body.fields);
    // => {username: ""} - if empty

    log(this.request.body.files);
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
