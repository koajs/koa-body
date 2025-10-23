import * as coBody from 'co-body';
import type { Middleware, Next } from 'koa';
import type { KoaBodyMiddlewareOptions, ScalarOrArrayFiles } from './types.js';
import { KoaBodyMiddlewareOptionsSchema } from './types.js';
import {
  isJsonBody,
  isMultipartBody,
  isTextBody,
  isUrlencodedBody,
} from './utils/body-type-util.js';
import parseWithFormidable from './utils/parse-with-formidable.js';
import { patchNodeAndKoa } from './utils/patch-util.js';
import toHttpMethod from './utils/string-method-to-enum-method.js';
import throwableToError from './utils/throwable-to-error.js';

export * from './types.js';

declare module 'koa' {
  interface Request {
    body?: { [key: string]: unknown } | string;
    rawBody?: string;
    files?: ScalarOrArrayFiles;
  }
}

declare module 'http' {
  interface IncomingMessage {
    body?: { [key: string]: unknown } | string;
    rawBody?: string;
    files?: ScalarOrArrayFiles;
  }
}

export function koaBody(options: Partial<KoaBodyMiddlewareOptions> = {}): Middleware {
  const validatedOptions = KoaBodyMiddlewareOptionsSchema.parse(options);
  const optionsToUse = { ...options, ...validatedOptions };
  return async (ctx, next: Next) => {
    const isJson = isJsonBody(ctx, optionsToUse);
    const isText = isTextBody(ctx, optionsToUse);
    const isUrlencoded = isUrlencodedBody(ctx, optionsToUse);
    const isMultipart = isMultipartBody(ctx, optionsToUse);
    const {
      encoding,
      jsonStrict,
      jsonLimit,
      includeUnparsed,
      formLimit,
      textLimit,
      queryString,
      formidable,
      onError,
      patchNode,
      patchKoa,
    } = optionsToUse;
    // only parse the body on specifically chosen methods
    if (validatedOptions.parsedMethods.includes(toHttpMethod(ctx.method.toUpperCase()))) {
      try {
        if (isJson) {
          const jsonBody = await coBody.json(ctx, {
            encoding,
            limit: jsonLimit,
            strict: jsonStrict,
            returnRawBody: includeUnparsed,
          });
          patchNodeAndKoa(ctx, jsonBody, {
            includeUnparsed,
            isMultipart,
            patchKoa,
            patchNode,
          });
        } else if (isUrlencoded) {
          const urlEncodedBody = await coBody.form(ctx, {
            encoding,
            limit: formLimit,
            queryString: queryString,
            returnRawBody: includeUnparsed,
          });
          patchNodeAndKoa(ctx, urlEncodedBody, {
            includeUnparsed,
            isMultipart,
            patchKoa,
            patchNode,
          });
        } else if (isText) {
          const textBody = await coBody.text(ctx, {
            encoding,
            limit: textLimit,
            returnRawBody: includeUnparsed,
          });
          patchNodeAndKoa(ctx, textBody, {
            includeUnparsed,
            isMultipart,
            patchKoa,
            patchNode,
          });
        } else if (isMultipart) {
          const multipartBody = await parseWithFormidable(ctx, formidable || {});
          patchNodeAndKoa(ctx, multipartBody, {
            includeUnparsed,
            isMultipart,
            patchKoa,
            patchNode,
          });
        }
      } catch (parsingError) {
        const error = throwableToError(parsingError);
        if (typeof onError === 'function') {
          onError(error, ctx);
        } else {
          throw error;
        }
      }
    }

    return next();
  };
}

export default koaBody;
