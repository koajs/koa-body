/*!
 * koa-body
 * Copyright (c) 2014. Daryl Lau (@daryllau), Charlike Mike Reagent (@tunnckoCore)
 * MIT LICENSE
 */

'use strict';

/**
 * Module dependencies.
 */

var co_body   = require('co-body');

/**
 * Expose `requestbody()`.
 */

module.exports = requestbody; 

/**
 * Initialize module middleware with the given `options`:
 * - `jsonLimit` limits application/json request body, co-body's option
 * - `formLimit` limits application/x-www-form-urlencoded request body, co-body's option
 * - `patchNode` Set the body parameter in the **Node** request object `this.req.body`
 * - `patchKoa` Set the body parameter in the **Koa** request object `this.request.body`
 * - `encoding` request encoding, co-body's option
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */
function requestbody(opts) {
  var jsonLimit = (opts && 'jsonLimit' in opts) ? opts.jsonLimit : '1mb',
      formLimit = (opts && 'formLimit' in opts) ? opts.formLimit : '56kb',
      patchNode = (opts && 'patchNode' in opts) ? opts.patchNode : false,
      patchKoa  = (opts && 'patchKoa'  in opts) ? opts.patchKoa  : true,
      encoding  = (opts && 'encoding'  in opts) ? opts.encoding  : 'utf-8';

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
