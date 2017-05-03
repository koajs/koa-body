var log     = console.log,
    Koa     = require('koa'),
    app     = new Koa(),
    koaBody = require('../index'),
    port    = process.env.PORT || 4290,
    host    = 'http://localhost';

app
  .use(koaBody({
    multipart: true,
    formLimit: 15,
    formidable: {
      uploadDir: __dirname + '/uploads'
    }
  }))
  .use((ctx) => {
    if (ctx.request.method == 'POST') {
      log(ctx.request.body);
      // => POST body object
      ctx.body = JSON.stringify(ctx.request.body, null, 2);
    }
  })
  .listen(port);


log('Visit %s:%s/ in browser.', host, port);
log();
log('Test with executing this commands:');
log('curl -i %s:%s/whatever -d "name=charlike"', host, port);
log('curl -i %s:%s/whatever -d "name=some-long-name-for-error"', host, port);
log('curl -i %s:%s/whatever -F "source=@%s/avatar.png"', host, port, __dirname);
log();
log('Press CTRL+C to stop...');
