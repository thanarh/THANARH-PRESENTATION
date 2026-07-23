# Thanarah Presentation Portal

A secure, invitation-only investor and partner presentation portal for Thanarah Medical-Tech.

## Stack

- **Frontend:** React 19, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui, Framer Motion, TanStack Query v5, Wouter
- **Backend:** Express 5, Node.js 22+, Mongoose 9 (MongoDB Atlas)
- **Tooling:** Orval (API client codegen from OpenAPI), esbuild, pnpm workspaces
- **Auth:** JWT + httpOnly cookies, 8-tier RBAC (Owner → Viewer)
- **Languages:** Arabic, English, Turkish, Urdu (RTL support)

## Running locally on Replit

Both workflows start automatically:

| Workflow | Service | Port |
|---|---|---|
| `artifacts/api-server: API Server` | Express API | 8080 |
| `artifacts/thanarah-portal: web` | Vite frontend | 21287 |

The API server builds via esbuild before starting (`pnpm run build && pnpm run start`).

## Seeding presentation content

After the API server is running:

```bash
pnpm --filter @workspace/api-server run seed
```

## Environment Variables

All configured in Replit Secrets / Env Vars:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `SESSION_SECRET` | Session tracking secret |
| `OWNER_SETUP_KEY` | One-time key for initial owner creation |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` | cPanel SMTP (noreply@thanarah.com) |
| `SMTP_FROM_EMAIL` / `SMTP_FROM_NAME` | Email sender identity |
| `MAIL_PROVIDER` | Set to `CPANEL` |
| `BASE_URL` / `FRONTEND_URL` | Public URL for links in emails |
| `THANARAH_OWNER_EMAIL_1` / `THANARAH_OWNER_EMAIL_2` | Owner notification addresses |
| `MONGODB_DATABASE_NAME` | `thanarah_presentation` |

## Workspace structure

```
artifacts/
  api-server/      — Express backend
  thanarah-portal/ — React frontend
lib/
  api-spec/        — OpenAPI 3.1 specs
  api-client-react/— Auto-generated TanStack Query hooks
  api-zod/         — Auto-generated Zod schemas
  db/              — Mongoose schemas and DB config
```

## Regenerating API client

After editing `lib/api-spec/openapi.yaml`:

```bash
pnpm run --filter @workspace/api-spec codegen
```

## User Preferences

- SMTP provider is cPanel (not SMTP2GO); SMTP_PASSWORD stored as Replit Secret
