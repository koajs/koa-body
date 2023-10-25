import type { Fields, Files } from 'formidable';
import formidable from 'formidable';
import type { Context } from 'koa';
import type { ExtendedFormidableOptions } from '../types';

export type ParseWithFormidableResult = {
  fields: Fields;
  files: Files;
};

export default async function parseWithFormidable(
  ctx: Context,
  options: ExtendedFormidableOptions,
): Promise<ParseWithFormidableResult> {
  const { onFileBegin, ...directOptions } = options;
  const form = formidable({ multiples: true, ...directOptions });
  if (onFileBegin) {
    form.on('fileBegin', onFileBegin);
  }
  const [fields, files] = await form.parse(ctx.req);
  return { fields, files };
}
