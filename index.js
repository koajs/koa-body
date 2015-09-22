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
  opts = opts || {};
  opts.patchNode = 'patchNode' in opts ? opts.patchNode : false;
  opts.patchKoa  = 'patchKoa'  in opts ? opts.patchKoa  : true;
  opts.multipart = 'multipart' in opts ? opts.multipart : false;
  opts.encoding  = 'encoding'  in opts ? opts.encoding  : 'utf-8';
  opts.jsonLimit = 'jsonLimit' in opts ? opts.jsonLimit : '1mb';
  opts.formLimit = 'formLimit' in opts ? opts.formLimit : '56kb';
  opts.formidable = 'formidable' in opts ? opts.formidable : {};
  opts.textLimit = 'textLimit' in opts ? opts.textLimit : '56kb';
  opts.strict = 'strict' in opts ? opts.strict : true;

  return function *(next){
    var body = {};
    // so don't parse the body in strict mode
    if (!opts.strict || ["GET", "HEAD", "DELETE"].indexOf(this.method.toUpperCase()) === -1) {
      if (this.is('json'))  {
        body = yield buddy.json(this, {encoding: opts.encoding, limit: opts.jsonLimit});
      }
      else if (this.is('urlencoded')) {
        body = yield buddy.form(this, {encoding: opts.encoding, limit: opts.formLimit});
      }
      else if (this.is('text')) {
        body = yield buddy.text(this, {encoding: opts.encoding, limit: opts.textLimit});
      }
      else if (opts.multipart && this.is('multipart')) {
        body = yield formy(this, opts.formidable);
      }
    }

    if (opts.patchNode) {
      this.req.body = body;
    }
    if (opts.patchKoa) {
      this.request.body = body;
    }
    yield next;
  };
}

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
    var form = new forms.IncomingForm(opts);
    var fields = {};
    var files = {};
    form
      .on('end', function() {
        done(null, {fields: fields, files: files});
      })
      .on('error', function(err) {
        done(err);
      })
      .on('field', function(field, value) {
        if (fields[field]) {
          if (Array.isArray(fields[field])) {
            fields[field].push(value);
          } else {
            fields[field] = [fields[field], value];
          }
        } else {
          fields[field] = value;
        }
      })
      .on('file', function(field, file) {
        if (files[field]) {
          if (Array.isArray(files[field])) {
            files[field].push(file);
          } else {
            files[field] = [files[field], file];
          }
        } else {
          files[field] = file;
        }
      });
    form.parse(ctx.req);
  };
}
