# Thanarah Presentation Portal

A secure, invitation-only presentation portal for the medical sector. Features multi-role access control, dynamic watermarking, session tracking, RTL/LTR multilingual support (AR/EN/TR/UR), and audit logging.

## Architecture

pnpm monorepo with two main services:

| Package | Description | Dev port |
|---------|-------------|----------|
| `@workspace/thanarah-portal` | React 19 + Vite 7 + Tailwind v4 frontend | 21287 |
| `@workspace/api-server` | Express 5 + Mongoose + JWT backend | 8080 |

Shared libraries under `lib/`: `api-spec` (OpenAPI), `api-client-react` (generated hooks), `api-zod` (Zod schemas).

## How to Run

Dependencies are installed automatically. Two workflows run simultaneously:

- **API Server** (`artifacts/api-server: API Server`) — builds with esbuild then starts
- **Portal** (`artifacts/thanarah-portal: web`) — Vite dev server, proxies `/api` → port 8080

## Required Secrets (Replit Secrets)

| Secret | Purpose |
|--------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Signs JWT access tokens |
| `OWNER_SETUP_KEY` | One-time key for `/api/auth/setup` to create first admin |
| `SMTP_PASSWORD` | cPanel SMTP password for `noreply@thanarah.com` |
| `SESSION_SECRET` | ✅ Already set |

## Required Env Vars (already set)

`NODE_ENV`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USERNAME`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`, `MONGODB_DATABASE_NAME`, `THANARAH_OWNER_EMAIL_1`, `THANARAH_OWNER_EMAIL_2`, `BASE_URL`, `FRONTEND_URL`

## Initial Setup (first run)

After secrets are set:
1. Visit `/setup` in the portal and use `OWNER_SETUP_KEY` to create the owner account
2. Optionally seed demo data: `pnpm --filter @workspace/api-server run seed`

## User Preferences

- Splash screen replaced with simple centered icon spinner (LogoSpinner)
- SMTP provider: cPanel (not SMTP2GO)
- SMTP_PASSWORD must remain in Replit Secrets only
