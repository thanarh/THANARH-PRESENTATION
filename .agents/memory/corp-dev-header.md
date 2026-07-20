---
name: Security Header CORP/COOP Dev Issue
description: CORP and COOP headers must be gated on production only.
---

# Cross-Origin-Resource-Policy in Dev

Setting `Cross-Origin-Resource-Policy: same-origin` and `Cross-Origin-Opener-Policy: same-origin` in development mode breaks the Vite proxy setup. In dev, the Vite dev server proxies `/api` to localhost:8080 — the API server sees cross-origin requests from the Vite proxy. These headers tell the browser to block cross-origin reads, silently breaking API calls.

**Why:** Replit's preview is HTTPS but the dev server is localhost; these headers are only safe once the full production HTTPS origin is established.

**How to apply:** Gate both headers inside `if (process.env.NODE_ENV === "production")` in `artifacts/api-server/src/app.ts`.
