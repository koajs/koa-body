import Router from '@koa/router';
import Koa from 'koa';
import koaBodyMiddleware from '../src/index.js';

const app = new Koa();
const router = new Router();
const koaBody = koaBodyMiddleware({ multipart: true });

const port = process.env.PORT || 4290;
const host = process.env.HOST || 'http://localhost';

router.post('/users', koaBody, (ctx) => {
  console.log(ctx.request.body);
  // => POST body
  ctx.body = JSON.stringify(ctx.request.body, null, 2);
});

router.get('/', (ctx) => {
  ctx.set('Content-Type', 'text/html');
  ctx.body = `
<!doctype html>
<html lang="en">
  <body>
    <form action="/" enctype="multipart/form-data" method="post">
    <input type="text" name="username" placeholder="username"><br>
    <input type="text" name="title" placeholder="tile of film"><br>
    <input type="file" name="uploads" multiple="multiple"><br>
    <button type="submit">Upload</button>
  </body>
</html>`;
});

router.post('/', koaBody, (ctx) => {
  console.log('fields: ', ctx.request.body);
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
});

app.use(router.routes());

app.listen(port);

console.log('Visit %s:%s/ in browser.', host, port);
console.log();
console.log('curl -i http://localhost:%s/users -d "user=admin"', port);
console.log('curl -i http://localhost:%s/ -F "source=@/path/to/file.png"', port);
console.log();
console.log('Press CTRL+C to stop...');
