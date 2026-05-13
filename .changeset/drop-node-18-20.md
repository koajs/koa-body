---
"koa-body": major
---

Drop support for Node.js 18 and 20, both of which are past end-of-life (Node 18 EOL April 2025, Node 20 EOL April 2026).

The minimum supported version is now **Node.js 22**. CI is tested against Node 22 (Maintenance LTS), 24 (Active LTS), and 26 (Current).

If you are on Node 18 or 20, upgrade to Node 22+ before updating `koa-body`. No source-level API changes accompany this bump — it reflects the supported runtime floor only.
