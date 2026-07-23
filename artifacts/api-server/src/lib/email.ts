/**
 * Email service — Thanarah Presentation Portal
 * Uses the official Thanarah cPanel SMTP account.
 * Credentials are read exclusively from server-side environment variables.
 * The SMTP password is NEVER logged, committed, or sent to the browser.
 *
 * © 2026 Thanarah Team — فريق ثناره
 */

import nodemailer, { type Transporter } from "nodemailer";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger";

// ─── Logo (embedded base64 for reliable email rendering) ─────────────────────
// Read at module load — never fetches from network, works in all email clients.
function loadLogoBase64(): string {
  const thisFile = fileURLToPath(import.meta.url);
  const candidates = [
    // build copies public/ → dist/public/ (most reliable in production)
    join(dirname(thisFile), "public/email-logo.png"),
    // dist/index.mjs → ../../public/email-logo.png (artifacts/api-server/public)
    join(dirname(thisFile), "../../public/email-logo.png"),
    // dist/lib/email.mjs → ../public (one level up)
    join(dirname(thisFile), "../public/email-logo.png"),
    // cwd = artifacts/api-server when started via pnpm filter
    join(process.cwd(), "public/email-logo.png"),
    // absolute fallback from workspace root
    join(dirname(thisFile), "../../../artifacts/api-server/public/email-logo.png"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p).toString("base64");
  }
  return ""; // graceful: no logo beats a broken email
}

const LOGO_B64 = loadLogoBase64();
const LOGO_TAG = LOGO_B64
  ? `<img src="data:image/png;base64,${LOGO_B64}" alt="Thanarah" width="180" style="display:block;margin:0 auto;max-width:180px;height:auto;" />`
  : `<p style="color:#A9CBB5;font-size:24px;font-weight:700;margin:0;letter-spacing:1px;">ثناره</p>`;

// ─── SMTP constants (hardcoded — only SMTP_PASSWORD comes from env) ──────────
const SMTP_HOST     = "business197.web-hosting.com";
const SMTP_PORT     = 465;
const SMTP_SECURE   = true;           // SSL on port 465
const SMTP_USER     = "noreply@thanarah.com";
const FROM_EMAIL    = "noreply@thanarah.com";
const FROM_NAME     = "Thanarah";

// ─── SMTP state ──────────────────────────────────────────────────────────────

type MailStatus = "ok" | "degraded" | "unchecked";

let _transporter: Transporter | null = null;
let _transporterPass: string | undefined;   // track which password the cached transport was built with
let _status: MailStatus = "unchecked";
let _lastVerified: Date | null = null;
let _lastError: string | null = null;

/** Returns current mail service health (safe to expose to admin UI). */
export function getMailStatus() {
  return {
    status: _status,
    provider: "cPanel SMTP",
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    sender: FROM_EMAIL,
    lastVerified: _lastVerified,
    lastError: _lastError, // sanitized — no credentials
  };
}

/** Lazy-initialise the shared Nodemailer transporter.
 *  Recreates it whenever SMTP_PASSWORD changes (e.g. late-set via env) so a
 *  server that started without the secret picks it up on the next send attempt.
 */
function getTransporter(): Transporter {
  const currentPass = process.env.SMTP_PASSWORD;
  if (_transporter && _transporterPass === currentPass) return _transporter;

  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: currentPass,
    },
    connectionTimeout: 30_000,
    greetingTimeout: 20_000,
    socketTimeout: 30_000,
    tls: { rejectUnauthorized: false },
  });
  _transporterPass = currentPass;

  return _transporter;
}

/** Verify SMTP on server startup — keeps the portal running on failure. */
export async function verifySmtpConnection(): Promise<void> {
  if (!process.env.SMTP_PASSWORD) {
    _status = "degraded";
    _lastError = "SMTP_PASSWORD secret is not configured";
    logger.warn("Mail service degraded: SMTP_PASSWORD not set");
    return;
  }
  try {
    await getTransporter().verify();
    _status = "ok";
    _lastVerified = new Date();
    _lastError = null;
    logger.info("Mail service: SMTP connection verified");
  } catch (err: any) {
    _status = "degraded";
    // Sanitise: remove anything that looks like a password/credential
    _lastError = String(err?.message ?? "SMTP verification failed").replace(
      /pass(word)?[^,\s]*/gi,
      "[redacted]",
    );
    logger.warn({ sanitizedError: _lastError }, "Mail service degraded");
  }
}

// ─── Sender identity ─────────────────────────────────────────────────────────

const fromAddress = () => `${FROM_NAME} <${FROM_EMAIL}>`;

// ─── Core send helper ────────────────────────────────────────────────────────

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<boolean> {
  try {
    await getTransporter().sendMail({
      from: fromAddress(),
      replyTo: opts.replyTo,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text ?? opts.subject,
    });
    logger.info({ to: opts.to, subject: opts.subject }, "Email sent");
    return true;
  } catch (err: any) {
    logger.error(
      {
        to: opts.to,
        subject: opts.subject,
        smtpCode: err?.code,
        smtpResponseCode: err?.responseCode,
        smtpResponse: err?.response,
        smtpCommand: err?.command,
        errMessage: err?.message,
      },
      "Failed to send email — SMTP error details",
    );
    return false;
  }
}

// ─── Base HTML template ──────────────────────────────────────────────────────

function baseTemplate(opts: {
  content: string;
  dir?: "rtl" | "ltr";
  lang?: string;
  logoUrl?: string;
}): string {
  const { content, dir = "rtl", lang = "ar" } = opts;
  return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="light"/>
  <title>Thanarah</title>
  <style>
    body{margin:0;padding:0;background:#F7F5F1;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#1A1A1A;}
    .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
    .hdr{background:#0F3D33;padding:32px 40px;text-align:center;}
    .hdr-logo{display:inline-block;margin:0 auto;}
    .hdr-logo-text{color:#A9CBB5;font-size:26px;font-weight:700;letter-spacing:1px;margin:0;line-height:1.2;}
    .hdr-sub{color:#A9CBB5;font-size:11px;letter-spacing:3px;margin:6px 0 0;font-weight:400;}
    .body{padding:40px 48px;line-height:1.75;font-size:15px;color:#1A1A1A;}
    .btn{display:inline-block;background:#1E6B4D;color:#fff !important;text-decoration:none;padding:15px 36px;border-radius:10px;font-weight:700;font-size:15px;margin:28px 0;letter-spacing:0.3px;}
    .details-card{background:#F7F5F1;border-radius:10px;padding:20px 24px;margin:24px 0;}
    .details-card p{margin:8px 0;font-size:14px;}
    .label{color:#1E6B4D;font-weight:600;}
    .notice{background:#FEF9EC;border:1px solid #F0C955;border-radius:8px;padding:14px 18px;font-size:13px;color:#7A5A00;margin:20px 0;}
    .divider{height:1px;background:#E5E2DC;margin:24px 0;}
    .ftr{background:#F7F5F1;border-top:1px solid #E5E2DC;padding:24px 40px;text-align:center;color:#6B7280;font-size:12px;line-height:1.8;}
    .ftr strong{color:#0F3D33;}
    @media(max-width:600px){.body{padding:28px 24px;}.hdr{padding:24px;}.ftr{padding:20px 24px;}}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      ${LOGO_TAG}
    </div>
    <div class="body">${content}</div>
    <div class="ftr">
      <strong>ثناره — تقنية تخدم الإنسان</strong><br/>
      Thanarah — Technology Serving People<br/><br/>
      <span style="color:#0F3D33;font-size:11px;">© 2026 Thanarah Team. All rights reserved.</span>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email templates ─────────────────────────────────────────────────────────

export async function sendInvitationEmail(opts: {
  to: string;
  inviteeName: string;
  inviteCode: string;
  portalUrl: string;
  expiresAt: Date;
  inviterName: string;
  customMessage?: string;
  lang?: string;
}): Promise<void> {
  const expiry = opts.expiresAt.toLocaleDateString("ar-SA", {
    year: "numeric", month: "long", day: "numeric",
  });
  const html = baseTemplate({
    content: `
      <p>مرحباً <span class="label">${opts.inviteeName}</span>،</p>
      <p>تمت دعوتك من قِبل <span class="label">${opts.inviterName}</span> للاطلاع على رؤية ومنظومة مشروع <strong>ثناره</strong> الطبي الشاملة.</p>
      ${opts.customMessage ? `<p>${opts.customMessage}</p>` : ""}

      <p style="margin:0 0 8px;font-weight:600;">كود الدعوة الخاص بك:</p>
      <center>
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#0F3D33;background:#F7F5F1;border:2px solid #A9CBB5;padding:20px 40px;border-radius:12px;display:inline-block;margin:8px 0;font-family:monospace;">
          ${opts.inviteCode}
        </div>
      </center>

      <div class="details-card" style="margin-top:20px;">
        <p><span class="label">صلاحية الدعوة:</span> ${expiry}</p>
      </div>

      <p>انقر على الزر أدناه للدخول إلى البوابة، ثم أدخل الكود أعلاه عند الطلب:</p>
      <center><a href="${opts.portalUrl}" class="btn">الدخول إلى بوابة ثناره</a></center>
      <div class="notice">
        هذه الدعوة شخصية ومخصصة للمستلم فقط. يرجى عدم مشاركتها أو إعادة توجيهها.<br/>
        This invitation is personal and intended only for its recipient. Do not share or forward it.
      </div>`,
  });
  const sent = await sendEmail({
    to: opts.to,
    subject: "دعوة خاصة للدخول إلى تجربة ثناره",
    html,
    text: `مرحباً ${opts.inviteeName}، تمت دعوتك إلى ثناره.\nكود الدعوة: ${opts.inviteCode}\nرابط البوابة: ${opts.portalUrl}\nصلاحية الدعوة: ${expiry}`,
  });
  if (!sent) throw new Error("SMTP delivery failed — check mail service status");
}

export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  code: string;
}): Promise<void> {
  const html = baseTemplate({
    content: `
      <p>مرحباً <span class="label">${opts.name}</span>،</p>
      <p>رمز التحقق من بريدك الإلكتروني هو:</p>
      <center>
        <div style="font-size:38px;font-weight:700;letter-spacing:10px;color:#0F3D33;background:#F7F5F1;padding:24px 40px;border-radius:10px;display:inline-block;margin:16px 0;">${opts.code}</div>
      </center>
      <p style="color:#6B7280;font-size:13px;">الرمز صالح لمدة 10 دقائق.</p>`,
  });
  await sendEmail({ to: opts.to, subject: "رمز التحقق — ثناره", html });
}

export async function sendLoginAlertEmail(opts: {
  to: string;
  name: string;
  ipAddress: string;
  country?: string;
  device: string;
  time: Date;
}): Promise<void> {
  const html = baseTemplate({
    content: `
      <p>مرحباً <span class="label">${opts.name}</span>،</p>
      <p>تم تسجيل دخول جديد إلى حسابك:</p>
      <div class="details-card">
        <p><span class="label">الجهاز:</span> ${opts.device}</p>
        <p><span class="label">العنوان:</span> ${opts.ipAddress}${opts.country ? ` (${opts.country})` : ""}</p>
        <p><span class="label">الوقت:</span> ${opts.time.toLocaleString("ar-SA")}</p>
      </div>
      <div class="notice">إذا لم تكن أنت، تواصل مع المسؤول فوراً.</div>`,
  });
  await sendEmail({ to: opts.to, subject: "تنبيه: تسجيل دخول جديد — ثناره", html });
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const html = baseTemplate({
    content: `
      <p>مرحباً <span class="label">${opts.name}</span>،</p>
      <p>تلقّينا طلباً لإعادة تعيين كلمة مرور حسابك. انقر على الزر أدناه:</p>
      <center><a href="${opts.resetUrl}" class="btn">إعادة تعيين كلمة المرور</a></center>
      <p style="color:#6B7280;font-size:13px;">الرابط صالح لمدة 30 دقيقة فقط. إذا لم تطلب ذلك، تجاهل هذا البريد.</p>`,
  });
  await sendEmail({ to: opts.to, subject: "إعادة تعيين كلمة المرور — ثناره", html });
}

export async function sendVisitRequestConfirmation(opts: {
  to: string;
  name: string;
}): Promise<void> {
  const html = baseTemplate({
    content: `
      <p>مرحباً <span class="label">${opts.name}</span>،</p>
      <p>تم استلام طلب زيارتك بنجاح.</p>
      <p>سيتم مراجعة طلبك والتواصل معك قريباً. شكراً لاهتمامك بثناره.</p>`,
  });
  await sendEmail({ to: opts.to, subject: "تأكيد استلام طلب الزيارة — ثناره", html });
}

export async function sendVisitRequestAdminNotification(opts: {
  to: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  reason: string;
  visitorType: string;
}): Promise<void> {
  const html = baseTemplate({
    content: `
      <p>طلب زيارة جديد:</p>
      <div class="details-card">
        <p><span class="label">الاسم:</span> ${opts.visitorName}</p>
        <p><span class="label">البريد:</span> ${opts.visitorEmail}</p>
        <p><span class="label">الجوال:</span> ${opts.visitorPhone}</p>
        <p><span class="label">النوع:</span> ${opts.visitorType}</p>
        <p><span class="label">السبب:</span> ${opts.reason}</p>
      </div>
      <p>يمكنك المراجعة والرد من لوحة تحكم ثناره.</p>`,
  });
  await sendEmail({
    to: opts.to,
    subject: `طلب زيارة جديد — ${opts.visitorName}`,
    html,
  });
}

export async function sendAdminInvitationNotification(opts: {
  adminEmails: string[];
  inviteeName: string;
  inviteeEmail: string;
  inviteePhone?: string;
  inviteCode: string;
  role: string;
  expiresAt: Date;
  inviterName: string;
}): Promise<void> {
  const expiry = opts.expiresAt.toLocaleDateString("ar-SA", {
    year: "numeric", month: "long", day: "numeric",
  });
  const html = baseTemplate({
    content: `
      <p>مرحباً،</p>
      <p>تم إرسال دعوة جديدة من قِبل <span class="label">${opts.inviterName}</span>.</p>
      <div class="details-card">
        <p><span class="label">المدعو:</span> ${opts.inviteeName}</p>
        <p><span class="label">البريد:</span> ${opts.inviteeEmail}</p>
        ${opts.inviteePhone ? `<p><span class="label">الجوال:</span> ${opts.inviteePhone}</p>` : ""}
        <p><span class="label">الصلاحية:</span> ${opts.role}</p>
        <p><span class="label">كود الدعوة:</span> <span style="font-family:monospace;font-weight:700;letter-spacing:4px;">${opts.inviteCode}</span></p>
        <p><span class="label">تنتهي:</span> ${expiry}</p>
      </div>
      <p style="color:#6B7280;font-size:13px;">هذا إشعار تلقائي من منظومة ثناره.</p>`,
  });
  for (const adminEmail of opts.adminEmails) {
    await sendEmail({
      to: adminEmail,
      subject: `دعوة جديدة — ${opts.inviteeName} (${opts.role})`,
      html,
      text: `دعوة جديدة لـ ${opts.inviteeName} (${opts.inviteeEmail}) بصلاحية ${opts.role}. الكود: ${opts.inviteCode}. تنتهي: ${expiry}.`,
    });
  }
}

export async function sendTestEmail(to: string): Promise<boolean> {
  const html = baseTemplate({
    content: `
      <p>هذا بريد تجريبي من نظام ثناره.</p>
      <div class="details-card">
        <p><span class="label">الخادم:</span> ${SMTP_HOST}</p>
        <p><span class="label">المُرسِل:</span> ${FROM_EMAIL}</p>
        <p><span class="label">الوقت:</span> ${new Date().toLocaleString("ar-SA")}</p>
      </div>
      <p style="color:#1E6B4D;font-weight:600;">✓ الاتصال بالبريد الإلكتروني يعمل بنجاح.</p>
      <hr style="border:none;border-top:1px solid #e5e2dc;margin:20px 0;"/>
      <p style="color:#6B7280;font-size:13px;">This is a test email from the Thanarah portal mail system.</p>`,
  });
  return sendEmail({ to, subject: "بريد تجريبي — ثناره | Test Email", html });
}
