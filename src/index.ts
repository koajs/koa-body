import { KoaBodyMiddlewareOptionsSchema } from './types';
import type { KoaBodyMiddlewareOptions } from './types';
import type { Context, Middleware, Next } from 'koa';
import * as Koa from 'koa';
import type { Files } from 'formidable';
import coBody from 'co-body';
import toHttpMethod from './utils/string-method-to-enum-method';
import throwableToError from './utils/throwable-to-error';
import { isJsonBody, isMultipartBody, isTextBody, isUrlencodedBody } from './utils/body-type-util';
import parseWithFormidable from './utils/parse-with-formidable';
import { patchNodeAndKoa } from './utils/patch-util';
import type { ContextWithBodyAndFiles } from './utils/patch-util';

export * from './types';

declare module 'koa' {
  interface Request extends Koa.BaseRequest {
    body?: any;
    files?: Files;
  }
}

export function koaBody(options: Partial<KoaBodyMiddlewareOptions> = {}): Middleware {
  const validatedOptions = KoaBodyMiddlewareOptionsSchema.parse(options);
  const optionsToUse = { ...options, ...validatedOptions };
  return async (ctx: Context, next: Next) => {
    const isJson = isJsonBody(ctx, optionsToUse);
    const isText = isTextBody(ctx, optionsToUse);
    const isUrlencoded = isUrlencodedBody(ctx, optionsToUse);
    const isMultipart = isMultipartBody(ctx, optionsToUse);
    const {
      encoding,
      jsonStrict,
      jsonLimit,
      includeUnparsed: returnRawBody,
      formLimit,
      textLimit,
      queryString,
      formidable,
      onError,
      patchNode,
      patchKoa,
      setEmptyBody,
    } = optionsToUse;
    // only parse the body on specifically chosen methods
    if (validatedOptions.parsedMethods.includes(toHttpMethod(ctx.method.toUpperCase()))) {
      try {
        if (isJson) {
          const jsonBody = await coBody.json(ctx, {
            encoding,
            limit: jsonLimit,
            strict: jsonStrict,
            returnRawBody,
          });
          patchNodeAndKoa(ctx as ContextWithBodyAndFiles, jsonBody, {
            isText,
            includeUnparsed: returnRawBody,
            isMultipart,
            patchKoa,
            patchNode,
          });
        } else if (isUrlencoded) {
          const urlEncodedBody = await coBody.form(ctx, {
            encoding,
            limit: formLimit,
            queryString: queryString,
            returnRawBody,
          });
          patchNodeAndKoa(ctx as ContextWithBodyAndFiles, urlEncodedBody, {
            isText,
            includeUnparsed: returnRawBody,
            isMultipart,
            patchKoa,
            patchNode,
          });
        } else if (isText) {
          const textBody = await coBody.text(ctx, {
            encoding,
            limit: textLimit,
            returnRawBody,
          });
          patchNodeAndKoa(ctx as ContextWithBodyAndFiles, textBody, {
            isText,
            includeUnparsed: returnRawBody,
            isMultipart,
            patchKoa,
            patchNode,
          });
        } else if (isMultipart) {
          const multipartBody = await parseWithFormidable(ctx, formidable || {});
          patchNodeAndKoa(ctx as ContextWithBodyAndFiles, multipartBody, {
            isText,
            includeUnparsed: returnRawBody,
            isMultipart,
            patchKoa,
            patchNode,
          });
        } else if (setEmptyBody) {
          patchNodeAndKoa(
            ctx as ContextWithBodyAndFiles,
            {},
            {
              isText,
              includeUnparsed: returnRawBody,
              isMultipart,
              patchKoa,
              patchNode,
            },
          );
        }
      } catch (parsingError) {
        const error = throwableToError(parsingError);
        if (typeof onError === 'function') {
          onError(error, ctx);
        } else {
          throw error;
        }
      }
    } else {
      patchNodeAndKoa(
        ctx as ContextWithBodyAndFiles,
        {},
        {
          isText,
          includeUnparsed: returnRawBody,
          isMultipart,
          patchKoa,
          patchNode,
        },
      );
    }

    return next();
  };
}

export default koaBody;
