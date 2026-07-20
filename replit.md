# Thanarah Presentation Portal

A secure, invitation-only platform for medical-tech presentations with multi-role access control, dynamic watermarking, session tracking, and multilingual support (AR, EN, TR, UR) with RTL-first design.

## Stack

- **Frontend**: React 19, TypeScript, Vite 7, TanStack Query v5, Wouter, Framer Motion, Tailwind CSS v4, shadcn/ui
- **Backend**: Express 5, Node.js 22+, MongoDB Atlas (Mongoose 9), JWT + httpOnly cookies, Pino logging
- **Tooling**: pnpm workspaces, Orval (OpenAPI codegen for API client/Zod schemas), esbuild

## Project Structure

```
artifacts/
  api-server/       — Express backend (port 8080)
  thanarah-portal/  — React/Vite frontend (port from $PORT)
  mockup-sandbox/   — Component preview sandbox
lib/
  api-spec/         — OpenAPI 3.1 definitions (source of truth for API)
  api-client-react/ — Auto-generated TanStack Query hooks (via Orval)
  api-zod/          — Auto-generated Zod validation schemas (via Orval)
  db/               — Drizzle ORM config (schema/scripts only)
```

## Running in Development

```bash
pnpm install
```

Both services start automatically via configured workflows:
- **API Server**: `artifacts/api-server: API Server` workflow (port 8080)
- **Frontend**: `artifacts/thanarah-portal: web` workflow (port from $PORT)

## Initial Setup (first time only)

1. Visit `/setup` in the browser and use your `OWNER_SETUP_KEY` to create the first owner account.
2. Seed presentation content: `pnpm --filter @workspace/api-server run seed`

## Required Secrets

| Secret | Purpose |
|--------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT signing secret |
| `SESSION_SECRET` | Session signing secret |
| `OWNER_SETUP_KEY` | Key for initial owner account creation |
| `SMTP_PASSWORD` | cPanel SMTP password for noreply@thanarah.com |

## Key Environment Variables (already configured)

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USERNAME`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`
- `MONGODB_DATABASE_NAME` — defaults to `thanarah_presentation`
- `THANARAH_OWNER_EMAIL_1`, `THANARAH_OWNER_EMAIL_2` — visit notification recipients
- `BASE_URL`, `FRONTEND_URL` — set to the Replit dev domain

## API Changes

Modify `lib/api-spec` OpenAPI definitions first, then regenerate client code:
```bash
pnpm --filter @workspace/api-client-react run generate
pnpm --filter @workspace/api-zod run generate
```

## User Preferences

- Use pnpm for all package management operations.
