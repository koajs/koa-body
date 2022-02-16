import * as Koa from "koa";
import { Files } from 'formidable';
import formidable from "formidable";

declare module "koa" {
    interface Request extends Koa.BaseRequest {
        body?: any;
        files?: Files;
    }
}

declare namespace koaBody {
    interface IKoaBodyOptions {
        /**
         * {Boolean} Patch request body to Node's ctx.req, default false
         *
         * Note: You can patch request body to Node or Koa in same time if you want.
         */
        patchNode?: boolean;

        /**
         * {Boolean} Patch request body to Koa's ctx.request, default true
         *
         * Note: You can patch request body to Node or Koa in same time if you want.
         */
        patchKoa?: boolean;

        /**
         * {String|Integer} The byte (if integer) limit of the JSON body, default 1mb
         */
        jsonLimit?: string|number;

        /**
         * {String|Integer} The byte (if integer) limit of the form body, default 56kb
         */
        formLimit?: string|number;

        /**
         * {String|Integer} The byte (if integer) limit of the text body, default 56kb
         */
        textLimit?: string|number;

        /**
         * {String} Sets encoding for incoming form fields, default utf-8
         */
        encoding?: string;

        /**
         * {Boolean} Parse multipart bodies, default false
         */
        multipart?: boolean;

        /**
         * {Boolean} Parse urlencoded bodies, default true
         */
        urlencoded?: boolean;

        /**
         * {Boolean} Parse text bodies, default true
         */
        text?: boolean;

        /**
         * {Boolean} Parse json bodies, default true
         */
        json?: boolean;

        /**
         * Toggles co-body strict mode; if true, only parses arrays or objects, default true
         */
        jsonStrict?: boolean;

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
        includeUnparsed?: boolean;

        /**
         * {Object} Options to pass to the formidable multipart parser
         */
        formidable?: formidable.Options;

        /**
         * {Function} Custom error handle, if throw an error, you can customize the response - onError(error, context), default will throw
         */
        onError?: (err: Error, ctx: Koa.Context) => void;

        /**
         * {Boolean} If enabled, don't parse GET, HEAD, DELETE requests; deprecated.
         *
         * GET, HEAD, and DELETE requests have no defined semantics for the request body,
         * but this doesn't mean they may not be valid in certain use cases.
         * koa-body is strict by default
         *
         * see http://tools.ietf.org/html/draft-ietf-httpbis-p2-semantics-19#section-6.3
         */
        strict?: boolean;

        /**
         * {String[]} What HTTP methods to enable body parsing for; should be used in preference to strict mode.
         *
         * GET, HEAD, and DELETE requests have no defined semantics for the request body,
         * but this doesn't mean they may not be valid in certain use cases.
         * koa-body will only parse HTTP request bodies for POST, PUT, and PATCH by default
         *
         * see http://tools.ietf.org/html/draft-ietf-httpbis-p2-semantics-19#section-6.3
         */
        parsedMethods?: string[];
    }
}

declare function koaBody (options?: koaBody.IKoaBodyOptions): Koa.Middleware<{}, {}>;

export = koaBody;
