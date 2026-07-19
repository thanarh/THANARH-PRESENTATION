# Thanarah Presentation Portal — بوابة ثناره التقديمية

A private, invitation-only investor & partner presentation portal for Thanarah Medical-Tech. Access is fully controlled via invite codes, JWT sessions, and role-based permissions (8 roles). All presentation views are watermarked and session-tracked.

## Run & Operate

Two workflows run in parallel — start them both from the **Workflows** panel:

| Workflow | Command | Port |
|---|---|---|
| **API Server** | `PORT=8080 pnpm --filter @workspace/api-server run dev` | 8080 |
| **Thanarah Portal** | `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/thanarah-portal run dev` | 3000 |

The Vite dev server proxies `/api/*` requests to the API server at port 8080.

### One-off commands
- `pnpm install` — install / sync all workspace dependencies
- `pnpm run typecheck` — typecheck all packages
- `pnpm run build` — typecheck + build everything
- `pnpm --filter @workspace/api-server run seed` — seed presentation data (run once after setup)

## Required Secrets

| Secret | Notes |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `SESSION_SECRET` | JWT signing secret (already set) |
| `SMTP2GO_USERNAME` | SMTP2GO username — optional, needed for invitation emails |
| `SMTP2GO_PASSWORD` | SMTP2GO password — optional, needed for invitation emails |

## Pre-configured Environment Variables (shared)

Set in `.replit` `[userenv.shared]`:
- `MONGODB_DATABASE_NAME` = `thanarah_presentation`
- `NODE_ENV` = `development`
- `SMTP2GO_HOST` / `SMTP2GO_PORT` / `SMTP_FROM_EMAIL` / `SMTP_FROM_NAME`
- `THANARAH_OWNER_EMAIL_1` / `THANARAH_OWNER_EMAIL_2`

## Stack

- **pnpm workspaces**, Node.js 20, TypeScript 5.9
- **Frontend**: React 19, Vite 7, Tailwind CSS 4, TanStack Query, Wouter, Radix UI (`artifacts/thanarah-portal`)
- **API**: Express 5, MongoDB + Mongoose 9, JWT (httpOnly cookies), bcryptjs (`artifacts/api-server`)
- **Shared libs**: `lib/api-client-react`, `lib/api-zod`, `lib/api-spec`, `lib/db`
- **Build**: esbuild (API bundle), Vite (frontend)

## Where Things Live

```
artifacts/
  thanarah-portal/   React + Vite frontend (port 3000)
  api-server/        Express API (port 8080)
lib/
  api-client-react/  Generated React Query hooks + custom fetch
  api-zod/           Generated Zod schemas
  api-spec/          OpenAPI spec (source of truth for API contracts)
  db/                Drizzle ORM schema (Postgres — not used by default; Mongo is primary)
```

## Architecture Decisions

- Auth uses **httpOnly JWT cookies** (no localStorage) to prevent XSS token theft.
- The API server builds to a single `dist/index.mjs` via esbuild before each dev start.
- MongoDB is the primary database (Mongoose); `lib/db` (Drizzle/Postgres) is present but unused by the current app.
- The Vite dev proxy (`/api → localhost:8080`) bridges the two services in development; in production the platform proxy handles path-based routing.

## Gotchas

- The API server **builds before starting** (`dev` = build + start). Cold starts take ~2–3 seconds.
- `PORT` and `BASE_PATH` env vars are **required** by both the Vite config and the API — the workflows set them inline.
- MongoDB duplicate-index warnings on startup are harmless (schema defines index twice via `index: true` + `schema.index()`).

## User Preferences

_Populate as you build._
