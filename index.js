/**
 * koa-body - index.js
 * Copyright(c) 2014
 * MIT Licensed
 *
 * @author  Daryl Lau (@dlau)
 * @author  Charlike Mike Reagent (@tunnckoCore)
 * @api private
 */

/**
 * Module dependencies.
 */

const buddy = require('co-body');
const forms = require('formidable');
const symbolUnparsed = require('./unparsed.js');

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
  return new Promise(((resolve, reject) => {
    const fields = {};
    const files = {};
    const form = new forms.IncomingForm(opts);
    form.on('end', () => resolve({
      fields,
      files,
    })).on('error', err => reject(err)).on('field', (field, value) => {
      if (fields[field]) {
        if (Array.isArray(fields[field])) {
          fields[field].push(value);
        } else {
          fields[field] = [fields[field], value];
        }
      } else {
        fields[field] = value;
      }
    }).on('file', (field, file) => {
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
  }));
}

/**
 *
 * @param {Object} options
 * @see https://github.com/dlau/koa-body
 * @api public
 */
function requestbody(opts) {
  const mergedOpts = opts || {};
  mergedOpts.onError = 'onError' in mergedOpts ? mergedOpts.onError : false;
  mergedOpts.patchNode = 'patchNode' in mergedOpts ? mergedOpts.patchNode : false;
  mergedOpts.patchKoa = 'patchKoa' in mergedOpts ? mergedOpts.patchKoa : true;
  mergedOpts.multipart = 'multipart' in mergedOpts ? mergedOpts.multipart : false;
  mergedOpts.urlencoded = 'urlencoded' in mergedOpts ? mergedOpts.urlencoded : true;
  mergedOpts.json = 'json' in mergedOpts ? mergedOpts.json : true;
  mergedOpts.text = 'text' in mergedOpts ? mergedOpts.text : true;
  mergedOpts.encoding = 'encoding' in mergedOpts ? mergedOpts.encoding : 'utf-8';
  mergedOpts.jsonLimit = 'jsonLimit' in mergedOpts ? mergedOpts.jsonLimit : '1mb';
  mergedOpts.jsonStrict = 'jsonStrict' in mergedOpts ? mergedOpts.jsonStrict : true;
  mergedOpts.formLimit = 'formLimit' in mergedOpts ? mergedOpts.formLimit : '56kb';
  mergedOpts.queryString = 'queryString' in mergedOpts ? mergedOpts.queryString : null;
  mergedOpts.formidable = 'formidable' in mergedOpts ? mergedOpts.formidable : {};
  mergedOpts.includeUnparsed = 'includeUnparsed' in mergedOpts ? mergedOpts.includeUnparsed : false;
  mergedOpts.textLimit = 'textLimit' in mergedOpts ? mergedOpts.textLimit : '56kb';

  // @todo: next major version, opts.strict support should be removed
  if (mergedOpts.strict && mergedOpts.parsedMethods) {
    throw new Error('Cannot use strict and parsedMethods options at the same time.');
  }

  if ('strict' in mergedOpts) {
    console.warn('DEPRECATED: opts.strict has been deprecated in favor of opts.parsedMethods.');
    if (mergedOpts.strict) {
      mergedOpts.parsedMethods = ['POST', 'PUT', 'PATCH'];
    } else {
      mergedOpts.parsedMethods = ['POST', 'PUT', 'PATCH', 'GET', 'HEAD', 'DELETE'];
    }
  }

  mergedOpts.parsedMethods = 'parsedMethods' in mergedOpts ? mergedOpts.parsedMethods : ['POST', 'PUT', 'PATCH'];
  mergedOpts.parsedMethods = mergedOpts.parsedMethods.map(method => method.toUpperCase());

  return function closure(ctx, next) {
    let bodyPromise;
    // only parse the body on specifically chosen methods
    if (mergedOpts.parsedMethods.includes(ctx.method.toUpperCase())) {
      try {
        if (mergedOpts.json && ctx.is('json')) {
          bodyPromise = buddy.json(ctx, {
            encoding: mergedOpts.encoding,
            limit: mergedOpts.jsonLimit,
            strict: mergedOpts.jsonStrict,
            returnRawBody: mergedOpts.includeUnparsed,
          });
        } else if (mergedOpts.urlencoded && ctx.is('urlencoded')) {
          bodyPromise = buddy.form(ctx, {
            encoding: mergedOpts.encoding,
            limit: mergedOpts.formLimit,
            queryString: mergedOpts.queryString,
            returnRawBody: mergedOpts.includeUnparsed,
          });
        } else if (mergedOpts.text && ctx.is('text')) {
          bodyPromise = buddy.text(ctx, {
            encoding: mergedOpts.encoding,
            limit: mergedOpts.textLimit,
            returnRawBody: mergedOpts.includeUnparsed,
          });
        } else if (mergedOpts.multipart && ctx.is('multipart')) {
          bodyPromise = formy(ctx, mergedOpts.formidable);
        }
      } catch (parsingError) {
        if (typeof mergedOpts.onError === 'function') {
          mergedOpts.onError(parsingError, ctx);
        } else {
          throw parsingError;
        }
      }
    }

    bodyPromise = bodyPromise || Promise.resolve({});
    return bodyPromise.catch((parsingError) => {
      if (typeof mergedOpts.onError === 'function') {
        mergedOpts.onError(parsingError, ctx);
      } else {
        throw parsingError;
      }
      return next();
    })
      .then((body) => {
        if (mergedOpts.patchNode) {
          if (isMultiPart(ctx, mergedOpts)) {
            ctx.req.body = body.fields;
            ctx.req.files = body.files;
          } else if (mergedOpts.includeUnparsed) {
            ctx.req.body = body.parsed || {};
            if (!ctx.is('text')) {
              ctx.req.body[symbolUnparsed] = body.raw;
            }
          } else {
            ctx.req.body = body;
          }
        }
        if (mergedOpts.patchKoa) {
          if (isMultiPart(ctx, mergedOpts)) {
            ctx.request.body = body.fields;
            ctx.request.files = body.files;
          } else if (mergedOpts.includeUnparsed) {
            ctx.request.body = body.parsed || {};
            if (!ctx.is('text')) {
              ctx.request.body[symbolUnparsed] = body.raw;
            }
          } else {
            ctx.request.body = body;
          }
        }
        return next();
      });
  };
}

/**
 * Expose `requestbody()`.
 */

module.exports = requestbody;
