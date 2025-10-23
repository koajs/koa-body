import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Koa from 'koa';
import koaBody from '../src/index.js';

const app = new Koa();
const port = process.env.PORT || 4290;
const host = 'http://localhost';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app
  .use(
    koaBody({
      multipart: true,
      formLimit: 15,
      formidable: {
        uploadDir: `${__dirname}/uploads`,
      },
    }),
  )
  .use((ctx) => {
    if (ctx.request.method === 'POST') {
      console.log(ctx.request.body);
      // => POST body object
      ctx.body = JSON.stringify(ctx.request.body, null, 2);
    }
  })
  .listen(port);

console.log('Visit %s:%s/ in browser.', host, port);
console.log();
console.log('Test with executing this commands:');
console.log('curl -i %s:%s/whatever -d "name=charlike"', host, port);
console.log('curl -i %s:%s/whatever -d "name=some-long-name-for-error"', host, port);
console.log('curl -i %s:%s/whatever -F "source=@%s/avatar.png"', host, port, __dirname);
console.log();
console.log('Press CTRL+C to stop...');
