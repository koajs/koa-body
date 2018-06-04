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
  opts.onError = 'onError' in opts ? opts.onError : false;
  opts.patchNode = 'patchNode' in opts ? opts.patchNode : false;
  opts.patchKoa = 'patchKoa' in opts ? opts.patchKoa : true;
  opts.multipart = 'multipart' in opts ? opts.multipart : false;
  opts.urlencoded = 'urlencoded' in opts ? opts.urlencoded : true;
  opts.json = 'json' in opts ? opts.json : true;
  opts.text = 'text' in opts ? opts.text : true;
  opts.encoding = 'encoding' in opts ? opts.encoding : 'utf-8';
  opts.jsonLimit = 'jsonLimit' in opts ? opts.jsonLimit : '1mb';
  opts.jsonStrict = 'jsonStrict' in opts ? opts.jsonStrict : true;
  opts.formLimit = 'formLimit' in opts ? opts.formLimit : '56kb';
  opts.queryString = 'queryString' in opts ? opts.queryString : null;
  opts.formidable = 'formidable' in opts ? opts.formidable : {};
  opts.textLimit = 'textLimit' in opts ? opts.textLimit : '56kb';
  opts.strict = 'strict' in opts ? opts.strict : true;

  return function (ctx, next) {
    var bodyPromise;
    // so don't parse the body in strict mode
    if (!opts.strict || ["GET", "HEAD", "DELETE"].indexOf(ctx.method.toUpperCase()) === -1) {
      try {
        if (opts.json && ctx.is('json')) {
          bodyPromise = buddy.json(ctx, {
            encoding: opts.encoding,
            limit: opts.jsonLimit,
            strict: opts.jsonStrict
          });
        } else if (opts.urlencoded && ctx.is('urlencoded')) {
          bodyPromise = buddy.form(ctx, {
            encoding: opts.encoding,
            limit: opts.formLimit,
            queryString: opts.queryString
          });
        } else if (opts.text && ctx.is('text')) {
          bodyPromise = buddy.text(ctx, {
            encoding: opts.encoding,
            limit: opts.textLimit
          });
        } else if (opts.multipart && ctx.is('multipart')) {
          bodyPromise = formy(ctx, opts.formidable);
        }
      } catch (parsingError) {
        if (typeof opts.onError === 'function') {
          opts.onError(parsingError, ctx);
        } else {
          throw parsingError;
        }
      }
    }

    bodyPromise = bodyPromise || Promise.resolve({});
    return bodyPromise.catch(function(parsingError) {
      if (typeof opts.onError === 'function') {
        opts.onError(parsingError, ctx);
      } else {
        throw parsingError;
      }
      return next();
    })
    .then(function(body) {
      if (opts.patchNode) {
        if (isMultiPart(ctx, opts)) {
          ctx.req.body = body.fields;
          ctx.req.files = body.files;
        } else {
          ctx.req.body = body;
        }
      }
      if (opts.patchKoa) {
        if (isMultiPart(ctx, opts)) {
          ctx.request.body = body.fields;
          ctx.request.files = body.files;
        } else {
          ctx.request.body = body;
        }
      }
      return next();
    })
  };
}

/**
 * Check if multipart handling is enabled and that this is a multipart request
 *
 * @param  {Object} ctx
 * @param  {Object} opts
 * @return {Boolean} true if request is multipart and being treated as so
 * @api private
 */
function isMultiPart(ctx, opts) {
  return opts.multipart && ctx.is('multipart');
}

/**
 * Donable formidable
 *
 * @param  {Stream} ctx
 * @param  {Object} opts
 * @return {Promise}
 * @api private
 */
function formy(ctx, opts) {
  return new Promise(function (resolve, reject) {
    var fields = {};
    var files = {};
    var form = new forms.IncomingForm(opts);
    form.on('end', function () {
      return resolve({
        fields: fields,
        files: files
      });
    }).on('error', function (err) {
      return reject(err);
    }).on('field', function (field, value) {
      if (fields[field]) {
        if (Array.isArray(fields[field])) {
          fields[field].push(value);
        } else {
          fields[field] = [fields[field], value];
        }
      } else {
        fields[field] = value;
      }
    }).on('file', function (field, file) {
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
    if (opts.onFileBegin) {
      form.on('fileBegin', opts.onFileBegin);
    }
    form.parse(ctx.req);
  });
}
