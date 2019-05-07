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
 * Donable formidable
 *
 * @param  {Object} ctx
 * @param  {Object} opts
 * @return {Promise}
 * @api private
 */
function formy(ctx, opts) {
  return new Promise((resolve, reject) => {
    const fields = {};
    const files = {};
    const form = new forms.IncomingForm(opts);

    form
      .on('end', () => resolve({ fields, files }))
      .on('error', err => reject(err))
      .on('field', (field, value) => {
        if (fields[field]) {
          if (!Array.isArray(fields[field])) {
            fields[field] = [fields[field]];
          }

          fields[field].push(value);
        } else {
          fields[field] = value;
        }
      })
      .on('file', (field, file) => {
        if (files[field]) {
          if (!Array.isArray(files[field])) {
            files[field] = [files[field]];
          }

          files[field].push(file);
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

/**
 *
 * @param {Object} options
 * @see https://github.com/dlau/koa-body
 * @api public
 */
function requestbody(_opts) {
  const opts = _opts || {};

  opts.onError = 'onError' in opts ? opts.onError : ((err) => { throw err; });
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
  opts.includeUnparsed = 'includeUnparsed' in opts ? opts.includeUnparsed : false;
  opts.textLimit = 'textLimit' in opts ? opts.textLimit : '56kb';

  opts.parsedMethods = 'parsedMethods' in opts ? opts.parsedMethods : ['POST', 'PUT', 'PATCH'];
  opts.parsedMethods = opts.parsedMethods.map(method => method.toUpperCase());

  if (typeof opts.onError !== 'function') {
    throw new Error('opts.onError must be a function');
  }

  return async function closure(ctx, next) {
    // bail out if the request body has already been handled by another body parser
    if (ctx.request.body !== undefined) {
      return next();
    }

    // ensure that the request body is always defined in some fashion
    ctx.request.body = {};

    // only parse the body on specifically chosen methods
    if (!opts.parsedMethods.includes(ctx.method.toUpperCase())) {
      return next();
    }

    try {
      if (opts.json && ctx.is('json')) {
        const body = await buddy.json(ctx, {
          encoding: opts.encoding,
          limit: opts.jsonLimit,
          strict: opts.jsonStrict,
          returnRawBody: opts.includeUnparsed,
        });

        if (opts.includeUnparsed) {
          ctx.request.body = body.parsed || {};
          ctx.request.body[symbolUnparsed] = body.raw;
        } else {
          ctx.request.body = body;
        }
      } else if (opts.urlencoded && ctx.is('urlencoded')) {
        const body = await buddy.form(ctx, {
          encoding: opts.encoding,
          limit: opts.formLimit,
          queryString: opts.queryString,
          returnRawBody: opts.includeUnparsed,
        });

        if (opts.includeUnparsed) {
          ctx.request.body = body.parsed || {};
          ctx.request.body[symbolUnparsed] = body.raw;
        } else {
          ctx.request.body = body;
        }
      } else if (opts.text && ctx.is('text')) {
        const body = await buddy.text(ctx, {
          encoding: opts.encoding,
          limit: opts.textLimit,
          returnRawBody: opts.includeUnparsed,
        });

        if (opts.includeUnparsed) {
          ctx.request.body = body.parsed || {};
          ctx.request.body[symbolUnparsed] = body.raw;
        } else {
          ctx.request.body = body;
        }
      } else if (opts.multipart && ctx.is('multipart')) {
        const body = await formy(ctx, opts.formidable);

<<<<<<< HEAD
      if (opts.includeUnparsed) {
        ctx.request.body = body.parsed || {};
      } else {
        ctx.request.body = body;
=======
        ctx.request.body = body.fields;
        ctx.request.files = body.files;
>>>>>>> parent of 1b91816... Remove support for "onError" option.
      }
    } catch (err) {
      opts.onError(err, ctx);
    }

    return next();
  };
}

/**
 * Expose `requestbody()`.
 */

module.exports = requestbody;
