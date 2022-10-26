import type { Context } from 'koa';
import symbolUnparsed from '../unparsed';
import type { Files } from 'formidable';

type PatchOptions = {
  isMultipart: string | boolean | null;
  isText: string | boolean | null;
  includeUnparsed: boolean;
  patchNode: boolean;
  patchKoa: boolean;
};

export type ContextWithBodyAndFiles = Context & {
  req: {
    body?: any;
    files?: Files;
  };
  request: {
    body?: any;
    files?: Files;
  };
};

export function patchNodeAndKoa(ctx: ContextWithBodyAndFiles, body: any, options: PatchOptions) {
  const { patchKoa, patchNode, isMultipart, includeUnparsed, isText } = options;

  if (patchNode) {
    if (isMultipart) {
      ctx.req.body = body.fields;
      ctx.req.files = body.files;
    } else if (includeUnparsed) {
      ctx.req.body = body.parsed || {};
      if (!isText) {
        ctx.req.body[symbolUnparsed] = body.raw;
      }
    } else {
      ctx.req.body = body;
    }
  }
  if (patchKoa) {
    if (isMultipart) {
      ctx.request.body = body.fields;
      ctx.request.files = body.files;
    } else if (includeUnparsed) {
      ctx.request.body = body.parsed || {};
      if (!isText) {
        ctx.request.body[symbolUnparsed] = body.raw;
      }
    } else {
      ctx.request.body = body;
    }
  }
}
