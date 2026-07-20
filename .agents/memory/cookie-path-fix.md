---
name: Cookie Path Bug Fixed
description: Express cookies must always have path "/" set explicitly.
---

# Cookie Path Bug

Express `res.cookie()` does NOT default to `path: "/"`. Without it, the browser scopes the cookie to the directory of the request URL (e.g. `/api/auth/` for a cookie set at `/api/auth/login`). This means subsequent requests to other paths (e.g. `/api/presentations`) never send the cookie, breaking authentication site-wide.

**Why:** The RFC and Express both omit the path attribute unless explicitly set, and browsers interpret absence as "directory of the URL that set the cookie".

**How to apply:** Always add `path: "/"` and `path: "/"` to `clearCookie()` calls in `artifacts/api-server/src/routes/auth.ts`.
