/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

//
// This example demonstrates running koa-body with koa-router.
//
// To run this example, please be sure to run `npm install`.
//

const Koa = require('koa');

const app = new Koa();
const router = require('koa-router')();
const koaBody = require('../index');

const port = process.env.PORT || 4290;
const host = process.env.HOST || 'http://localhost';

/*!
 * Accepts only urlencoded and json bodies.
 */
router.post('/post/users', koaBody(),
  (ctx) => {
    const { body } = ctx.request;
    console.log('body', body);
    // => POST body object
    ctx.body = JSON.stringify(body, null, 2);
  });

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
      uploadDir: `${__dirname}/uploads`,
    },
  }),
  (ctx) => {
    const { fields } = ctx.request.body; // this will be undefined for file uploads
    const { files } = ctx.request;
    console.log('files', JSON.stringify(files, null, 2));
    /* {
      "requestFields": null,
      "requestFiles": {
        "source": {
          "size": 748831,
          "path": "/some-dir/upload_cc1e0c49b97af0b9ef17b7b2f96b307d",
          "name": "avatar.png",
          "type": "image/png",
          "mtime": "2018-07-07T14:16:22.576Z"
        }
      }
    } */

    // respond with the fields and files for example purposes
    ctx.body = JSON.stringify({
      requestFields: fields || null,
      requestFiles: files || null,
    }, null, 2);
  });

app.use(router.routes());
app.listen(port);

console.log('Visit %s:%s/ in browser.', host, port);
console.log();
console.log('Test with executing this commands:');
console.log('curl -i %s:%s/post/users -d "user=admin"', host, port);
console.log('curl -i %s:%s/post/upload -F "source=@%s/avatar.png"', host, port, __dirname);
console.log();
console.log('Press CTRL+C to stop...');
