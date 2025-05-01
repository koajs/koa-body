import type { Fields, Files, File } from 'formidable';
import formidable from 'formidable';
import type { Context } from 'koa';
import type { ExtendedFormidableOptions } from '../types';

// Define legacy-compatible types that match Formidable v2 behavior
export type ScalarOrArrayFields = {
  [field: string]: string | string[];
};

export type ScalarOrArrayFiles = {
  [file: string]: File | File[];
};

export type ParseWithFormidableResult = {
  fields: ScalarOrArrayFields;
  files: ScalarOrArrayFiles;
};

export default function parseWithFormidable(
  ctx: Context,
  options: ExtendedFormidableOptions,
): Promise<ParseWithFormidableResult> {
  const { onFileBegin, ...directOptions } = options;
  const form = formidable({ multiples: true, ...directOptions });
  if (onFileBegin) {
    form.on('fileBegin', onFileBegin);
  }
  return new Promise((resolve, reject) => {
    form.parse(ctx.req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }

      // Convert fields and files to maintain backward compatibility with v2
      const processedFields = convertFormidableFields(fields);
      const processedFiles = convertFormidableFiles(files);

      resolve({ fields: processedFields, files: processedFiles });
    });
  });
}

// Helper function for fields that handles undefined values
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

// Helper function for files that handles undefined values
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
