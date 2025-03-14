import type { Context } from 'koa';
import type { ParseWithFormidableResult } from './parse-with-formidable.js';

export type ParseWithCoBodyTextResult = string;
export type ParseWithCoBodyJsonResult = { [key: string]: unknown };
export type ParseWithCoBodyUrlEncodedResult = { [key: string]: unknown };
export type ParseWithCoBodyIncludeUnparsedResult = { parsed: ParseWithCoBodyResult; raw: string };

export type ParseWithCoBodyResult =
  | ParseWithCoBodyTextResult
  | ParseWithCoBodyJsonResult
  | ParseWithCoBodyUrlEncodedResult;

type PatchOptions = {
  isMultipart: string | boolean | null;
  includeUnparsed: boolean;
  patchNode: boolean;
  patchKoa: boolean;
};

export function patchNodeAndKoa(
  ctx: Context,
  body: ParseWithFormidableResult | ParseWithCoBodyResult | ParseWithCoBodyIncludeUnparsedResult,
  options: PatchOptions,
) {
  const { patchKoa, patchNode, isMultipart, includeUnparsed } = options;

  if (patchNode) {
    if (isMultipart) {
      const { fields, files } = body as ParseWithFormidableResult;
      ctx.req.body = fields;
      ctx.req.files = files;
    } else if (includeUnparsed) {
      const { parsed, raw } = body as ParseWithCoBodyIncludeUnparsedResult;
      ctx.req.body = parsed;
      ctx.req.rawBody = raw;
    } else {
      ctx.req.body = body;
    }
  }
  if (patchKoa) {
    if (isMultipart) {
      const { fields, files } = body as ParseWithFormidableResult;
      ctx.request.body = fields;
      ctx.request.files = files;
    } else if (includeUnparsed) {
      const { parsed, raw } = body as ParseWithCoBodyIncludeUnparsedResult;
      ctx.request.body = parsed;
      ctx.request.rawBody = raw;
    } else {
      ctx.request.body = body;
    }
  }
}
