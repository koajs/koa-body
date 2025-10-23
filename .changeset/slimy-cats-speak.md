---
"koa-body": major
---

chore: introduce `@biomejs/biome` as linter and formatter instead of `prettier`
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
