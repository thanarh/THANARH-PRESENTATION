# Thanarah Presentation Portal — بوابة ثناره التقديمية

A secure, invitation-only investor & partner presentation portal for Thanarah Medical-Tech. Built with React 19 + Vite (frontend), Express 5 (API), and MongoDB Atlas.

## Project Structure

```
artifacts/
  api-server/          — Express 5 API server (port 8080 in dev)
  thanarah-portal/     — React 19 + Vite frontend (port from $PORT)
  mockup-sandbox/      — Design mockup preview server
lib/
  db/                  — PostgreSQL schema + Drizzle ORM
  api-client-react/    — Auto-generated React Query hooks
  api-spec/            — OpenAPI spec + Orval codegen config
  api-zod/             — Zod validators for API I/O
```

## How to Run

The project uses pnpm workspaces. Both services start automatically via the configured workflows:

- **API Server** — `PORT=8080 pnpm --filter @workspace/api-server run dev`
- **Thanarah Portal** — `pnpm --filter @workspace/thanarah-portal run dev`

To install dependencies after a fresh clone:
```bash
pnpm install
```

## Required Secrets

Set these in Replit Secrets (never commit them):

| Secret | Purpose |
|--------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string (`mongodb+srv://...`) |
| `JWT_SECRET` | JWT signing key |
| `SMTP_PASSWORD` | cPanel SMTP password for `noreply@thanarah.com` |
| `SESSION_SECRET` | Express session secret |
| `OWNER_SETUP_KEY` | One-time key for first owner account creation |

## Environment Variables (already configured)

| Variable | Value |
|----------|-------|
| `SMTP_HOST` | business197.web-hosting.com |
| `SMTP_PORT` | 465 |
| `SMTP_SECURE` | true |
| `SMTP_USERNAME` | noreply@thanarah.com |
| `SMTP_FROM_EMAIL` | noreply@thanarah.com |
| `SMTP_FROM_NAME` | Thanarah |
| `MAIL_PROVIDER` | CPANEL |
| `MONGODB_DATABASE_NAME` | thanarah_presentation |
| `NODE_ENV` | development |

## Access Model

The portal is invitation-only — no public registration. Roles: Owner → Super Admin → Admin → Presenter → Investor → Partner → Team Member → Viewer.

## User Preferences

- Keep the existing monorepo structure (pnpm workspaces)
- SMTP uses cPanel only (not SMTP2GO)
- SMTP_PASSWORD stays in Replit Secrets only — never logged or committed
