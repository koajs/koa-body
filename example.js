/*!
 * koa-body
 * Copyright (c) 2014. Daryl Lau (@daryllau), Charlike Mike Reagent (@tunnckoCore)
 * MIT LICENSE
 */
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
