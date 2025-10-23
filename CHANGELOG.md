## Unreleased

## 7.0.0

### Major Changes

- [#239](https://github.com/koajs/koa-body/pull/239) [`e59b8ce`](https://github.com/koajs/koa-body/commit/e59b8ce9c593504cb8a8c8ed36e6ea89c8df3064) Thanks [@TheDadi](https://github.com/TheDadi)! - chore: introduce `@biomejs/biome` as linter and formatter instead of `prettier`
  chore: introduce `@changesets/cli` to automate publish and changelog
  chore: introduce GitHub actions for publishing to npm
  chore: introduce GitHub actions for preview publish using `pkg-pr-new`
  chore: replace `mocha` with `node:test`
  chore: updated all dependencies to latest
  chore: updated dev dependency `koa-router` to use `@koa/router` instead
  chore: introduce `tshy` and `@arethetypeswrong/cli` to have esm and commonjs exports and verification that types and exports are compatible with different module resolutions (fixes: https://github.com/koajs/koa-body/issues/233)
  chore: introduce `pnpm` as package-manager

  refactor: use `ctx.request.rawBody` instead of `ctx.request.body[symbolUnparsed]` for unparsed body if `includeUnparsed` is set
  refactor: `ctx.request.rawBody` is also set on content-type `text/*` if `includeUnparsed` is set
  refactor: if given method is not in `parsedMethods` do not patch koa and node with empty object anymore (fixes: https://github.com/koajs/koa-body/issues/238)
  refactor: changed type of `ctx.req.body` and `ctx.request.body` from `any` to `{ [key: string]: unknown } | string`

  feat: allow to override formidable `onPart` see https://github.com/node-formidable/formidable#formonpart (fixes: https://github.com/koajs/koa-body/issues/172)

  docs: updated README.md to reflect changes
  docs: reworked examples to use `typescript`

## 6.0.0 (future release)

- rewrite in TypeScript (thanks @TheDadi)
- removed the deprecated strict option
- add "application/reports+json" to allowed types (#204)
- test against Node.js 14+

## 5.0.0

Mistakenly republished v4.2.0. See #207.

## 4.2.0

- support all text content types (#179)
- adds TypeScript integration testing (#177)
- removes testing against EOL Node.js verions

## 4.1.3

Reverted changes introduced in 4.1.2. Now 4.1.3 is effectively the same as 4.1.1.

## 4.1.2

Bad TypeScript definition file change (#173). Do not use this version.

## 4.1.1

- adds support for JSON Patch, JSON API and CSP report out of the box:
  - application/json-patch+json (https://tools.ietf.org/html/rfc6902)
  - application/vnd.api+json (https://jsonapi.org/)
  - application/csp-report (https://www.w3.org/TR/CSP2/#violation-reports)

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
