/**
 * waNotify — fire-and-forget WhatsApp notification helpers.
 *
 * All functions are safe to call regardless of whether WhatsApp is connected;
 * failures are logged as warnings and never propagate to the caller.
 */
import { whatsappService } from "../services/whatsapp";
import { logger } from "./logger";
import { randomUUID } from "node:crypto";

/** Convert a digits-only phone number to a WhatsApp JID */
function toJid(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  return `${clean}@s.whatsapp.net`;
}

/** Send a raw text message — silent on failure */
export async function notifyWa(phone: string, message: string): Promise<void> {
  try {
    await whatsappService.sendMessage(toJid(phone), message);
  } catch (err) {
    logger.warn({ errorName: err instanceof Error ? err.name : "unknown" }, "WA notification skipped (non-fatal)");
  }
}

// ── Pre-built notification templates ─────────────────────────────────────────

export function isQiroxOtpConfigured(): boolean {
  return Boolean(process.env.QIROX_PROJECT_API_TOKEN && process.env.QIROX_PROJECT_ID);
}

export async function notifyQiroxMessage(
  phone: string,
  message: string,
  recipientName = "Thanarah portal user",
): Promise<void> {
  const token = process.env.QIROX_PROJECT_API_TOKEN;
  const projectId = process.env.QIROX_PROJECT_ID;
  if (!token || !projectId) {
    throw new Error("QIROX WhatsApp credentials are not configured");
  }

  const digits = phone.replace(/\D/g, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) {
    throw new Error("Phone number must include its international country code");
  }

  const response = await fetch(
    `https://qiroxstudio.online/api/v1/projects/${encodeURIComponent(projectId)}/whatsapp`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `thanarah-message-${randomUUID()}`,
      },
      body: JSON.stringify({
        recipient: { phone: `+${digits}`, name: recipientName },
        platformName: "Thanarah Medical-Tech",
        clientName: recipientName,
        message,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`QIROX WhatsApp API returned HTTP ${response.status}`);
  }
}

export async function notifyWaOtp(
  phone: string,
  code: string,
  lang: "ar" | "en" = "ar",
  clientName = "Thanarah portal user",
  purpose: "login" | "invitation" = "login",
): Promise<void> {
  const token = process.env.QIROX_PROJECT_API_TOKEN;
  const projectId = process.env.QIROX_PROJECT_ID;
  if (!token || !projectId) {
    throw new Error("QIROX WhatsApp credentials are not configured");
  }

  const digits = phone.replace(/\D/g, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) {
    throw new Error("Phone number must include its international country code");
  }

  const msg =
    lang === "ar"
      ? `🔐 *ثناره — رمز التحقق*\n\n${purpose === "invitation" ? "رمز تفعيل دعوتك:" : "رمز تسجيل الدخول:"}\n\n*${code}*\n\nصالح لمدة 5 دقائق. لا تشاركه مع أحد.`
      : `🔐 *Thanarah — Verification Code*\n\n${purpose === "invitation" ? "Your invitation activation code:" : "Your sign-in code:"}\n\n*${code}*\n\nValid for 5 minutes. Do not share it.`;

  const response = await fetch(
    `https://qiroxstudio.online/api/v1/projects/${encodeURIComponent(projectId)}/whatsapp`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `thanarah-otp-${randomUUID()}`,
      },
      body: JSON.stringify({
        recipient: { phone: `+${digits}`, name: clientName },
        platformName: "Thanarah Medical-Tech",
        clientName,
        code,
        message: msg,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`QIROX WhatsApp API returned HTTP ${response.status}`);
  }
}

export async function notifyWaLoginAlert(
  phone: string,
  name: string,
  ip: string,
  device: string,
  lang: "ar" | "en" = "ar"
): Promise<void> {
  const msg =
    lang === "ar"
      ? `⚠️ *تنبيه دخول — ثناية*\n\nمرحباً ${name}،\nتم تسجيل دخول جديد إلى حسابك.\n\n📱 الجهاز: ${device}\n🌐 IP: ${ip}\n\nإذا لم تكن أنت، غيّر كلمة مرورك فوراً.`
      : `⚠️ *Login Alert — Thanarah*\n\nHello ${name},\nA new sign-in was detected on your account.\n\n📱 Device: ${device}\n🌐 IP: ${ip}\n\nIf this wasn't you, change your password immediately.`;
  await notifyWa(phone, msg);
}

export async function notifyWaPasswordReset(
  phone: string,
  name: string,
  lang: "ar" | "en" = "ar"
): Promise<void> {
  const msg =
    lang === "ar"
      ? `🔑 *إعادة تعيين كلمة المرور — ثناية*\n\nمرحباً ${name}،\nتم طلب إعادة تعيين كلمة مرور حسابك.\n\nإذا لم تطلب ذلك، تجاهل هذا الإشعار.`
      : `🔑 *Password Reset — Thanarah*\n\nHello ${name},\nA password reset was requested for your account.\n\nIf you didn't request this, you can ignore this message.`;
  await notifyWa(phone, msg);
}

export async function notifyWaInvitationSent(
  adminPhone: string,
  inviteeName: string,
  role: string,
  lang: "ar" | "en" = "ar"
): Promise<void> {
  const msg =
    lang === "ar"
      ? `📨 *دعوة جديدة — ثناية*\n\nتم إرسال دعوة إلى *${inviteeName}*\nالدور: ${role}\n\nيمكنك متابعة الدعوات من لوحة الإدارة.`
      : `📨 *New Invitation — Thanarah*\n\nAn invitation was sent to *${inviteeName}*\nRole: ${role}\n\nTrack invitations from the admin panel.`;
  await notifyWa(adminPhone, msg);
}

export async function notifyWaInvitationLink(
  userPhone: string,
  inviteeName: string,
  inviteUrl: string,
  code: string,
  lang: "ar" | "en" = "ar"
): Promise<void> {
  const token = process.env.QIROX_PROJECT_API_TOKEN;
  const projectId = process.env.QIROX_PROJECT_ID;
  if (!token || !projectId) throw new Error("QIROX WhatsApp credentials are not configured");

  const digits = userPhone.replace(/\D/g, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) {
    throw new Error("Phone number must include its international country code");
  }

  const message =
    lang === "ar"
      ? `مرحباً ${inviteeName}، تمت دعوتك إلى ثناره.\n\nافتح رابط الدعوة لتفعيل حسابك:\n${inviteUrl}\n\nرمز التحقق: *${code}*\n\nهذا رمز تحقق حقيقي لرقم جوالك، صالح لمدة 5 دقائق. إذا انتهت صلاحيته، اطلب رمزاً جديداً من صفحة التفعيل.`
      : `Hello ${inviteeName}, you are invited to Thanarah.\n\nOpen this invitation link to activate your account:\n${inviteUrl}\n\nVerification code: *${code}*\n\nThis is a real phone verification code, valid for 5 minutes. If it expires, request a new code from the activation page.`;

  const response = await fetch(
    `https://qiroxstudio.online/api/v1/projects/${encodeURIComponent(projectId)}/whatsapp`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `thanarah-invite-${randomUUID()}`,
      },
      body: JSON.stringify({
        recipient: { phone: `+${digits}`, name: inviteeName },
        platformName: "Thanarah Medical-Tech",
        clientName: inviteeName,
        code,
        message,
      }),
    },
  );
  if (!response.ok) throw new Error(`QIROX WhatsApp API returned HTTP ${response.status}`);
}

export async function notifyWaSystemUpdate(
  phone: string,
  title: string,
  body: string,
  lang: "ar" | "en" = "ar"
): Promise<void> {
  const msg =
    lang === "ar"
      ? `📢 *${title} — ثناية*\n\n${body}`
      : `📢 *${title} — Thanarah*\n\n${body}`;
  await notifyWa(phone, msg);
}
