/// <reference types="koa" />
import * as Koa from 'koa';
import type { Files } from 'formidable';

declare module 'koa' {
  interface Request extends Koa.BaseRequest {
    body?: any;
    files?: Files;
  }
}
