---
name: SMTP Configuration
description: Thanarah uses cPanel SMTP (not SMTP2GO). Env vars and constraints.
---

## Rule
Use cPanel SMTP via Nodemailer. Never SMTP2GO. Never log or commit SMTP_PASSWORD.

**Why:** SMTP2GO credentials were previously exposed. Switched to official Thanarah cPanel account.

## Config
- Host: business197.web-hosting.com
- Port: 465, secure: true (SSL/TLS)
- User: noreply@thanarah.com
- From: SMTP_FROM_NAME + SMTP_FROM_EMAIL env vars

## Secrets required
- SMTP_PASSWORD → Replit Secret (never in code)

## Non-secrets (shared env)
SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USERNAME, SMTP_FROM_EMAIL, SMTP_FROM_NAME, MAIL_PROVIDER=CPANEL

## How to apply
- email.ts uses getTransporter() (lazy singleton) — no reconnect per email
- verifySmtpConnection() called at startup — degrades gracefully, never crashes portal
- sendTestEmail(to) exported for admin use
