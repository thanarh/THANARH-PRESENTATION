---
name: SMTP Configuration
description: cPanel SMTP only; SMTP2GO is configured but not used.
---

# SMTP Setup

The project uses **cPanel SMTP** (`business197.web-hosting.com`, port 465, SSL) via Nodemailer. SMTP2GO env vars exist (`SMTP2GO_HOST`, `SMTP2GO_PORT`) but are unused — ignore them.

`SMTP_PASSWORD` must live in Replit Secrets only (never in env var files or logs).

`verifySmtpConnection()` is called at server startup in `artifacts/api-server/src/index.ts` and logs `Mail service: SMTP connection verified` on success.

**Why:** The user explicitly chose cPanel over SMTP2GO; changing providers requires updating `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USERNAME` env vars and the `SMTP_PASSWORD` secret.
