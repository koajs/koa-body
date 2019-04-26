## 5.0.0 (Unreleased)

### Breaking Changes
- drops support for Node.js 6
- deprecated `strict` option removed
- drops `patchNode` option
  - there is not longer an option to add body to the node `request` object
- drops `patchKoa` option
  - body is always added to Koa's `ctx.request` object
- `ctx.request.body` is not modified if another body parser has run
- `ctx.request.body`, if `koa-body` executes, is always defined
- `onError` option now throws an error if provided something other than a function

### Non-Breaking Changes
- internally refactored to use async/await

## 4.1.0
- adds `parsedMethods` option to specify which request methods will be parsed
- deprecates `strict` option, which will be removed in koa-body 5.0.0

### Migrating from 4.x.x to 4.1.0
Migration from prior 4.x.x versions is strightforward.

- If you used `strict: true`, simply remove this option. The new defaults will behave the same way.
- If you used `strict: false`, set `parsedMethods` to the set of methods you would like to parse. For example, `parsedMethods: ['GET', 'POST', 'PUT', 'PATCH']`

## 4.0.0 - 4.0.8 - Summary of Changes
- mutliple type definition updates
- adds `includeUnparsed` option to get raw body

## Breaking Changes in v3/4
To address a potential [security vulnerability](https://snyk.io/vuln/npm:koa-body:20180127):
  - The `files` property has been moved to `ctx.request.files`. In prior versions, `files` was a property of `ctx.request.body`.
  - The `fields` property is flatten (merged) into `ctx.request.body`. In prior versions, `fields` was a property of `ctx.request.body`.

If you do not use multipart uploads, no changes to your code need to be made.

Versions 1 and 2 of `koa-body` are deprecated and replaced with versions 3 and 4, respectively.
