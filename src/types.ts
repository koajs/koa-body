import type { Options as CoBodyOptions } from 'co-body';
import type { File, Options as FormidableOptions } from 'formidable';
import type { Context } from 'koa';
import { z } from 'zod';

export enum HttpMethodEnum {
  POST = 'POST',
  GET = 'GET',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
}

const HttpMethod = z.nativeEnum(HttpMethodEnum);
export type HttpMethod = z.infer<typeof HttpMethod>;

export type ExtendedFormidableOptions = FormidableOptions & {
  onFileBegin?: (name: string, file: File) => void;
};

export const KoaBodyMiddlewareOptionsSchema = z.object({
  /**
   * {Boolean} Patch request body to Node's ctx.req, default false
   *
   * Note: You can patch request body to Node or Koa in same time if you want.
   */
  patchNode: z.boolean().optional().default(false),
  /**
   * {Boolean} Patch request body to Koa's ctx.request, default true
   *
   * Note: You can patch request body to Node or Koa in same time if you want.
   */
  patchKoa: z.boolean().optional().default(true),
  /**
   * {String|Integer} The byte (if integer) limit of the JSON body, default 1mb
   */
  jsonLimit: z.union([z.string(), z.number()]).optional().default('1mb'),
  /**
   * {String|Integer} The byte (if integer) limit of the form body, default 56kb
   */
  formLimit: z.union([z.string(), z.number()]).optional().default('56kb'),
  /**
   * {String|Integer} The byte (if integer) limit of the text body, default 56kb
   */
  textLimit: z.union([z.string(), z.number()]).optional().default('56kb'),
  /**
   * {String} Sets encoding for incoming form fields, default utf-8
   */
  encoding: z.string().optional().default('utf-8'),
  /**
   * {Boolean} Parse multipart bodies, default false
   */
  multipart: z.boolean().optional().default(false),

  /**
   * {Boolean} Parse urlencoded bodies, default true
   */
  urlencoded: z.boolean().optional().default(true),

  /**
   * {Boolean} Parse text bodies, default true
   */
  text: z.boolean().optional().default(true),

  /**
   * {Boolean} Parse json bodies, default true
   */
  json: z.boolean().optional().default(true),
  /**
   * {Boolean} Toggles co-body strict mode; if true, only parses arrays or objects, default true
   */
  jsonStrict: z.boolean().optional().default(true),

  /**
     * Toggles co-body returnRawBody mode; if true,
     * the raw body will be available using a Symbol for 'unparsedBody'.
     *
     * ```
     // Either:
     const unparsed = require('koa-body/unparsed.js');
     const unparsed = Symbol.for('unparsedBody');

     // Then later, to access:
     ctx.request.body[unparsed]
     ```
     * default false
     */
  includeUnparsed: z.boolean().optional().default(false),

  /**
   * {String[]} What HTTP methods to enable body parsing for; should be used in preference to strict mode.
   *
   * GET, HEAD, and DELETE requests have no defined semantics for the request body,
   * but this doesn't mean they may not be valid in certain use cases.
   * koa-body will only parse HTTP request bodies for POST, PUT, and PATCH by default
   *
   * see http://tools.ietf.org/html/draft-ietf-httpbis-p2-semantics-19#section-6.3
   */
  parsedMethods: z
    .array(HttpMethod)
    .optional()
    .default([HttpMethodEnum.POST, HttpMethodEnum.PUT, HttpMethodEnum.PATCH]),
});

export type KoaBodyDirectOptions = z.infer<typeof KoaBodyMiddlewareOptionsSchema>;

export type KoaBodyMiddlewareOptions = KoaBodyDirectOptions & {
  onError?: (err: Error, ctx: Context) => void;
  formidable?: ExtendedFormidableOptions;
  queryString?: CoBodyOptions['queryString'];
};
