'use strict';
var co_body = require('co-body');

module.exports = function(opts){
    var patchNode = (opts && 'patchNode' in opts) ? opts.patchNode : false;
    var patchKoa = (opts && 'patchKoa' in opts) ? opts.patchKoa : true;
    var jsonLimit = (opts && 'jsonLimit' in opts) ? opts.jsonLimit : '1mb';
    var formLimit = (opts && 'formLimit' in opts) ? opts.formLimit : '56kb';
    var encoding = (opts && 'encoding' in opts) ? opts.encoding : 'utf-8';

  return function *(next){
    var body;
    if(this.is('application/json')){
      body = yield co_body.json(this,{encoding: encoding, limit: jsonLimit});
    }
    else if(this.is('application/x-www-form-urlencoded')){
      body = yield co_body.form(this,{encoding: encoding, limit: formLimit});
    }
    if(patchNode){
      this.req.body = body;
    }
    if(patchKoa){
      this.request.body = body;
    }
    yield next;
  };
};
