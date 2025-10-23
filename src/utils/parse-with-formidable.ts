import type { Fields, Files, Part } from 'formidable';
import formidable from 'formidable';
import type { Context } from 'koa';
import type {
  ExtendedFormidableOptions,
  ScalarOrArrayFields,
  ScalarOrArrayFiles,
} from '../types.js';

export type ParseWithFormidableResult = {
  fields: ScalarOrArrayFields;
  files: ScalarOrArrayFiles;
};

function convertFormidableFields(fields: Fields): ScalarOrArrayFields {
  const result: ScalarOrArrayFields = {};

  for (const key in fields) {
    const value = fields[key];
    if (value !== undefined) {
      result[key] = value.length === 1 ? value[0] : value;
    }
  }

  return result;
}

function convertFormidableFiles(files: Files): ScalarOrArrayFiles {
  const result: ScalarOrArrayFiles = {};

  for (const key in files) {
    const value = files[key];
    if (value !== undefined) {
      result[key] = value.length === 1 ? value[0] : value;
    }
  }

  return result;
}

export default async function parseWithFormidable(
  ctx: Context,
  options: ExtendedFormidableOptions,
): Promise<ParseWithFormidableResult> {
  const { onFileBegin, onPart, ...directOptions } = options;
  const form = formidable({ multiples: true, ...directOptions });

  if (onPart) {
    const delegate = form._handlePart.bind(form);
    form.onPart = (part: Part) => {
      onPart(part, delegate);
    };
  }

  if (onFileBegin) {
    form.on('fileBegin', onFileBegin);
  }
  const [fields, files] = await form.parse(ctx.req);
  return { fields: convertFormidableFields(fields), files: convertFormidableFiles(files) };
}
