import type { Context } from 'koa';
import type { KoaBodyMiddlewareOptions } from '../types.js';

const jsonTypes = [
  'application/json',
  'application/json-patch+json',
  'application/vnd.api+json',
  'application/csp-report',
  'application/reports+json',
];

export function isJsonBody(ctx: Context, options: KoaBodyMiddlewareOptions) {
  return options.json && ctx.is(jsonTypes);
}

export function isUrlencodedBody(ctx: Context, options: KoaBodyMiddlewareOptions) {
  return options.urlencoded && ctx.is('urlencoded');
}

export function isTextBody(ctx: Context, options: KoaBodyMiddlewareOptions) {
  return options.text && ctx.is('text/*');
}

export function isMultipartBody(ctx: Context, options: KoaBodyMiddlewareOptions) {
  return options.multipart && ctx.is('multipart');
}
