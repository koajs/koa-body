import type { Context } from 'koa';
import type { KoaBodyMiddlewareOptions } from '../types.js';

export function isJsonBody(ctx: Context, options: KoaBodyMiddlewareOptions) {
  return options.json && ctx.is(options.jsonTypes);
}

export function isUrlencodedBody(ctx: Context, options: KoaBodyMiddlewareOptions) {
  return options.urlencoded && ctx.is(options.urlencodedTypes);
}

export function isTextBody(ctx: Context, options: KoaBodyMiddlewareOptions) {
  return options.text && ctx.is(options.textTypes);
}

export function isMultipartBody(ctx: Context, options: KoaBodyMiddlewareOptions) {
  return options.multipart && ctx.is(options.multipartTypes);
}
