import type { Fields, Files, Part } from 'formidable';
import formidable from 'formidable';
import type { Context } from 'koa';
import type { ExtendedFormidableOptions } from '../types.js';

export type ParseWithFormidableResult = {
  fields: Fields;
  files: Files;
};

export default function parseWithFormidable(
  ctx: Context,
  options: ExtendedFormidableOptions,
): Promise<ParseWithFormidableResult> {
  const { onFileBegin, onPart, ...directOptions } = options;
  const form = formidable({ multiples: true, ...directOptions });

  if (onPart) {
    form.onPart = function (part: Part) {
      onPart(part, form._handlePart.bind(this));
    };
  }

  if (onFileBegin) {
    form.on('fileBegin', onFileBegin);
  }

  return new Promise((resolve, reject) => {
    form.parse(ctx.req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ fields, files });
    });
  });
}
