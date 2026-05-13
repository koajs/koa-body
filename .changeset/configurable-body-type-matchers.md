---
"koa-body": minor
---

Add configurable body-type matchers: `jsonTypes`, `urlencodedTypes`, `textTypes`, and `multipartTypes`.

These options let callers customize which `Content-Type` values are parsed as which body kind, without patching the middleware internals. Each accepts an array of types passed directly to Koa's `ctx.is(...)`, so the standard mime patterns (e.g. `urlencoded`, `multipart`, `text/*`, `application/vnd.custom+json`) all work.

Defaults preserve the previous behavior:

- `jsonTypes`: `application/json`, `application/json-patch+json`, `application/vnd.api+json`, `application/csp-report`, `application/reports+json`
- `urlencodedTypes`: `urlencoded`
- `textTypes`: `text/*`
- `multipartTypes`: `multipart`

Example — parse a vendor JSON type and a custom multipart type:

```ts
app.use(
  koaBody({
    jsonTypes: ['application/json', 'application/vnd.custom+json'],
    multipart: true,
    multipartTypes: ['multipart', 'application/x-custom-multipart'],
  }),
);
```