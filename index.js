/**
 * koa-body - index.js
 * Copyright(c) 2014
 * MIT Licensed
 *
 * @author  Daryl Lau (@dlau)
 * @author  Charlike Mike Reagent (@tunnckoCore)
 * @api private
 */

'use strict';

/**
 * Module dependencies.
 */

var buddy = require('co-body');
var forms = require('formidable');

/**
 * Expose `requestbody()`.
 */

module.exports = requestbody; 

/**
 *
 * @param {Object} options
 * @see https://github.com/dlau/koa-body
 * @api public
 */
function requestbody(opts) {
  opts = opts || {}
  opts.patchNode = (opts && 'patchNode' in opts) ? opts.patchNode : false,
  opts.patchKoa  = (opts && 'patchKoa'  in opts) ? opts.patchKoa  : true,
  opts.multipart = (opts && 'multipart' in opts) ? opts.multipart : false;
  opts.encoding  = (opts && 'encoding'  in opts) ? opts.encoding  : 'utf-8',
  opts.jsonLimit = (opts && 'jsonLimit' in opts) ? opts.jsonLimit : '1mb',
  opts.formLimit = (opts && 'formLimit' in opts) ? opts.formLimit : '56kb';
  opts.formidable = (opts && 'formidable' in opts) ? opts.formidable : {};

  return function *(next){
    var body;
    if (this.is('json'))  {
      body = yield buddy.json(this, {encoding: opts.encoding, limit: opts.jsonLimit});
    }
    else if (this.is('urlencoded')) {
      body = yield buddy.form(this, {encoding: opts.encoding, limit: opts.formLimit});
    }
    else if (opts.multipart && this.is('multipart')) {
      body = yield formy(this, opts.formidable);
    }

    if (opts.patchNode) {
      this.req.body = body;
    }
    if (opts.patchKoa) {
      this.request.body = body;
    }
    yield next;
  };
};

/**
 * Donable formidable
 * 
 * @param  {Stream} ctx
 * @param  {Object} opts
 * @return {Object}
 * @api private
 */
function formy(ctx, opts) {
  return function(done) {
    var form = new forms.IncomingForm(opts)
    form.parse(ctx.req, function(err, fields, files) {
      if (err) return done(err)
      done(null, {fields: fields, files: files})
    })
  }
}
