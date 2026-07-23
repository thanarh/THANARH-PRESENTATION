/**
 * WhatsApp Admin Command Processor — ثناره
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Handles secure admin commands from whitelisted phone numbers.
 * All commands work in Arabic and English.
 *
 * Admin phones are configured via WA_ADMIN_PHONES env var:
 *   WA_ADMIN_PHONES=966501234567,966509876543
 *   (country code + number, no spaces or +, comma-separated)
 */

import crypto from "crypto";
import User from "../models/user";
import Invitation from "../models/invitation";
import Session from "../models/session";
import AuditLog from "../models/auditLog";
import { connectDb } from "../lib/db";
import { sendInvitationEmail, sendEmail } from "../lib/email";
import { logger } from "../lib/logger";

// ─── Admin phone whitelist ────────────────────────────────────────────────────

function getAdminPhones(): Set<string> {
  const raw = process.env.WA_ADMIN_PHONES ?? "";
  return new Set(
    raw
      .split(",")
      .map((p) => p.trim().replace(/\D/g, ""))
      .filter(Boolean),
  );
}

/**
 * Returns true if the WhatsApp JID belongs to a configured admin phone.
 * JID format: 966501234567@s.whatsapp.net or 966501234567:N@s.whatsapp.net
 */
export function isAdminPhone(jid: string): boolean {
  const phones = getAdminPhones();
  if (phones.size === 0) return false;
  const digits = jid.split("@")[0].split(":")[0];
  return phones.has(digits);
}

// ─── Formatters & helpers ─────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RIYADH_OPTS = { timeZone: "Asia/Riyadh" } as const;

function now() {
  return new Date().toLocaleString("ar-SA", { ...RIYADH_OPTS });
}

function dateLabel(d: Date) {
  return d.toLocaleDateString("ar-SA", {
    ...RIYADH_OPTS,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function timeLabel(d: Date) {
  return d.toLocaleTimeString("ar-SA", {
    ...RIYADH_OPTS,
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ROLE_AR: Record<string, string> = {
  owner:        "🔑 مالك",
  super_admin:  "👑 مشرف أعلى",
  admin:        "🛡️ مسؤول",
  presenter:    "🎤 مُقدِّم",
  investor:     "💼 مستثمر",
  partner:      "🤝 شريك",
  team_member:  "👨‍💼 فريق",
  viewer:       "👁️ زائر",
};

const STATUS_AR: Record<string, string> = {
  active:               "✅ نشط",
  sent:                 "📨 مُرسَل",
  opened:               "👁️ فُتح",
  registration_started: "📝 جارٍ التسجيل",
  pending:              "⏳ منتظر",
  expired:              "⌛ منتهي",
  revoked:              "❌ ملغي",
  failed_delivery:      "⚠️ فشل الإرسال",
  used:                 "✔️ مُستخدَم",
  disabled:             "🚫 موقوف",
  draft:                "📝 مسودة",
  blocked:              "🔒 محظور",
};

function roleLabel(r: string)   { return ROLE_AR[r]   ?? r; }
function statusLabel(s: string) { return STATUS_AR[s]  ?? s; }

/** Generates a readable XXXX-NNNN invite code */
function genCode(): string {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const N = "0123456789";
  const p1 = Array.from({ length: 4 }, () => A[crypto.randomInt(A.length)]).join("");
  const p2 = Array.from({ length: 4 }, () => N[crypto.randomInt(N.length)]).join("");
  return `${p1}-${p2}`;
}

/** Find an active owner/super_admin to act as system creator */
async function getSystemUser() {
  return User.findOne({
    role: { $in: ["owner", "super_admin"] },
    status: "active",
  }).lean();
}

const SEP = "━━━━━━━━━━━━━━━━━━━━";

// ─── Command handlers ─────────────────────────────────────────────────────────

async function cmdHelp(): Promise<string> {
  return `
*🤖 بوت ثناره الإداري*
${SEP}

*📊 التقارير والمراقبة*
▸ \`حالة\` — ملخص سريع للنظام
▸ \`تقرير\` — تقرير شامل ومفصّل
▸ \`مستخدمين\` — آخر المستخدمين المسجلين
▸ \`دعوات\` — آخر الدعوات وحالتها
▸ \`جلسات\` — الجلسات النشطة الآن
▸ \`سجل\` — آخر 5 أحداث في النظام

*🔑 إدارة الدعوات*
▸ \`دعوة email الاسم\`
  ← إنشاء دعوة وإرسالها بالبريد
  _مثال: دعوة ahmed@co.com أحمد العمري_

▸ \`كود email الاسم\`
  ← كود سريع بدون إرسال بريد
  _مثال: كود sarah@co.com سارة_

*📧 البريد الإلكتروني*
▸ \`بريد email الرسالة\`
  ← إرسال رسالة مخصصة فورياً
  _مثال: بريد ahmed@co.com موعدك غداً الساعة 10_

*📱 إعدادات واتساب*
▸ \`حسابات\` — عرض الأرقام والمسؤولين من قاعدة البيانات

${SEP}
_🌐 كل الأوامر تعمل بالعربية والإنجليزية_
_🕒 ${now()}_
`.trim();
}

// ── حالة ─────────────────────────────────────────────────────────────────────

async function cmdStatus(): Promise<string> {
  await connectDb();

  const [
    totalUsers, activeUsers,
    totalInvites, activeInvites, pendingInvites, failedInvites,
    activeSessions, highRiskSessions,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "active" }),
    Invitation.countDocuments(),
    Invitation.countDocuments({ status: "active" }),
    Invitation.countDocuments({ status: { $in: ["sent", "opened", "registration_started"] } }),
    Invitation.countDocuments({ status: "failed_delivery" }),
    Session.countDocuments({ status: "active" }),
    Session.countDocuments({ status: "active", riskScore: { $in: ["high", "critical"] } }),
  ]);

  const riskLine = highRiskSessions > 0
    ? `\n🔴 *تنبيه: ${highRiskSessions} جلسة عالية الخطورة!*`
    : "\n🟢 لا تنبيهات أمنية";

  return `
*📊 حالة منصة ثناره*
${SEP}
👥 *المستخدمون*
  نشطون: *${activeUsers}* من إجمالي ${totalUsers}

✉️ *الدعوات*
  نشطة: *${activeInvites}* | معلقة: *${pendingInvites}* | فشل: *${failedInvites}*
  الإجمالي: ${totalInvites}

🌐 *الجلسات النشطة: ${activeSessions}*${riskLine}
${SEP}
_🕒 ${now()}_
`.trim();
}

// ── تقرير ─────────────────────────────────────────────────────────────────────

async function cmdReport(): Promise<string> {
  await connectDb();

  const [usersByRole, invitesByStatus, activeSessions, highRisk, recentUsers] = await Promise.all([
    User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Invitation.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Session.countDocuments({ status: "active" }),
    Session.countDocuments({ status: "active", riskScore: { $in: ["high", "critical"] } }),
    User.find().sort({ createdAt: -1 }).limit(3).select("fullName role createdAt").lean(),
  ]);

  const usersSection = usersByRole.length
    ? usersByRole.map((r: any) => `  ${roleLabel(r._id)}: *${r.count}*`).join("\n")
    : "  لا يوجد مستخدمون";

  const invitesSection = invitesByStatus.length
    ? invitesByStatus.map((r: any) => `  ${statusLabel(r._id)}: *${r.count}*`).join("\n")
    : "  لا توجد دعوات";

  const recentSection = recentUsers.length
    ? recentUsers
        .map((u: any) => `  • ${u.fullName} — ${roleLabel(u.role)}`)
        .join("\n")
    : "  لا يوجد مستخدمون جدد";

  const riskLine = highRisk > 0
    ? `\n⚠️ *تحذير: ${highRisk} جلسة عالية الخطورة!*`
    : "";

  return `
*📋 تقرير ثناره الشامل*
${SEP}

*👥 المستخدمون حسب الدور:*
${usersSection}

*✉️ الدعوات حسب الحالة:*
${invitesSection}

*🌐 الجلسات النشطة: ${activeSessions}*${riskLine}

*🆕 آخر المستخدمين المسجلين:*
${recentSection}

${SEP}
_🕒 ${now()}_
`.trim();
}

// ── مستخدمين ──────────────────────────────────────────────────────────────────

async function cmdUsers(): Promise<string> {
  await connectDb();

  const users = await User.find()
    .sort({ createdAt: -1 })
    .limit(8)
    .select("fullName email role status lastLoginAt")
    .lean();

  if (!users.length) return "👥 لا يوجد مستخدمون حتى الآن.";

  const lines = users
    .map((u: any) => {
      const login = u.lastLoginAt ? timeLabel(new Date(u.lastLoginAt)) : "لم يدخل بعد";
      return `*${u.fullName}*\n  ${roleLabel(u.role)} | ${statusLabel(u.status)}\n  📧 ${u.email}\n  🕒 آخر دخول: ${login}`;
    })
    .join("\n\n");

  return `*👥 آخر ${users.length} مستخدمين*\n${SEP}\n\n${lines}\n${SEP}\n_🕒 ${now()}_`;
}

// ── دعوات ─────────────────────────────────────────────────────────────────────

async function cmdInvitations(): Promise<string> {
  await connectDb();

  const invites = await Invitation.find()
    .sort({ createdAt: -1 })
    .limit(8)
    .select("inviteeName email role status inviteCode expiresAt")
    .lean();

  if (!invites.length) return "✉️ لا توجد دعوات حتى الآن.";

  const lines = invites
    .map((inv: any) => {
      const code = inv.inviteCode ? `🔑 \`${inv.inviteCode}\`` : "بدون كود";
      return `*${inv.inviteeName}*\n  ${roleLabel(inv.role)} | ${statusLabel(inv.status)}\n  📧 ${inv.email}\n  ${code} | ⌛ ${dateLabel(new Date(inv.expiresAt))}`;
    })
    .join("\n\n");

  return `*✉️ آخر ${invites.length} دعوات*\n${SEP}\n\n${lines}\n${SEP}\n_🕒 ${now()}_`;
}

// ── جلسات ─────────────────────────────────────────────────────────────────────

async function cmdSessions(): Promise<string> {
  await connectDb();

  const sessions = await Session.find({ status: "active" })
    .sort({ lastActivityAt: -1 })
    .limit(8)
    .populate("userId", "fullName email role")
    .lean();

  if (!sessions.length) return "🌐 لا توجد جلسات نشطة حالياً.";

  const lines = sessions
    .map((s: any) => {
      const user  = s.userId as any;
      const name  = user?.fullName ?? "مجهول";
      const role  = roleLabel(user?.role ?? "");
      const risk  = { low: "🟢", medium: "🟡", high: "🟠", critical: "🔴" }[s.riskScore as string] ?? "⚪";
      const since = timeLabel(new Date(s.startedAt));
      const last  = timeLabel(new Date(s.lastActivityAt));
      return `${risk} *${name}* (${role})\n  📍 ${s.ipAddress} | من ${since} | نشاط: ${last}`;
    })
    .join("\n\n");

  return `*🌐 الجلسات النشطة (${sessions.length})*\n${SEP}\n\n${lines}\n${SEP}\n_🕒 ${now()}_`;
}

// ── سجل الأحداث ───────────────────────────────────────────────────────────────

async function cmdAuditLog(): Promise<string> {
  await connectDb();

  const logs = await AuditLog.find()
    .sort({ timestamp: -1 })
    .limit(5)
    .lean();

  if (!logs.length) return "📜 لا توجد أحداث مسجلة حتى الآن.";

  const lines = logs
    .map((a: any) => {
      const icon   = a.result === "success" ? "✅" : a.result === "failure" ? "❌" : "🔒";
      const risk   = { low: "🟢", medium: "🟡", high: "🟠", critical: "🔴" }[a.riskScore as string] ?? "⚪";
      const t      = timeLabel(new Date(a.timestamp));
      return `${icon}${risk} *${a.action}*\n  👤 ${a.actor} | 🕒 ${t}`;
    })
    .join("\n\n");

  return `*📜 آخر 5 أحداث في النظام*\n${SEP}\n\n${lines}\n${SEP}\n_🕒 ${now()}_`;
}

// ── دعوة / كود ────────────────────────────────────────────────────────────────

async function cmdInvite(args: string[], sendMail: boolean): Promise<string> {
  const usage = sendMail
    ? `⚠️ *الاستخدام:* دعوة email الاسم\n_مثال: دعوة ahmed@co.com أحمد العمري_`
    : `⚠️ *الاستخدام:* كود email الاسم\n_مثال: كود sarah@co.com سارة خالد_`;

  if (!args.length) return usage;

  const email = args[0].toLowerCase().trim();
  if (!EMAIL_RE.test(email)) {
    return `❌ *البريد الإلكتروني غير صحيح:* ${email}\n${usage}`;
  }

  const inviteeName = args.slice(1).join(" ").trim() || email.split("@")[0];

  await connectDb();

  const systemUser = await getSystemUser();
  if (!systemUser) {
    return "❌ لا يوجد حساب إداري في النظام.\nأنشئ حساب المالك أولاً عبر /api/setup.";
  }

  // Prevent duplicate active invitations
  const existing = await Invitation.findOne({
    email,
    status: { $in: ["sent", "active", "opened", "registration_started", "draft"] },
  }).lean();

  if (existing) {
    const code = (existing as any).inviteCode ? `\n🔑 الكود الحالي: \`${(existing as any).inviteCode}\`` : "";
    const exp  = dateLabel(new Date((existing as any).expiresAt));
    return `⚠️ يوجد دعوة نشطة بالفعل لـ *${email}*\nالحالة: ${statusLabel((existing as any).status)} | تنتهي: ${exp}${code}`;
  }

  const inviteCode = genCode();
  const rawToken   = crypto.randomBytes(32).toString("hex");
  const tokenHash  = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await Invitation.create({
    inviteeName,
    email,
    tokenHash,
    inviteCode,
    role: "investor",
    permissions: [],
    allowedSections: [],
    expiresAt,
    maxLogins: 5,
    maxDevices: 2,
    sessionDurationMinutes: 60,
    status: "draft",
    allowComments: false,
    allowFullScreen: true,
    allowViewFinancials: false,
    createdBy: systemUser._id,
  });

  // Quick code only — no email
  if (!sendMail) {
    return `
*⚡ كود دعوة سريع*
${SEP}
👤 *${inviteeName}*
📧 ${email}
🔑 الكود: \`${inviteCode}\`
📅 تنتهي: ${dateLabel(expiresAt)}
🎯 الدور: ${roleLabel("investor")}
${SEP}
_أرسل هذا الكود للمستخدم يدوياً_
_لم يُرسَل أي بريد إلكتروني_`.trim();
  }

  // Send invitation email
  try {
    const portalUrl = (process.env.FRONTEND_URL ?? process.env.BASE_URL ?? "").replace(/\/$/, "");
    await sendInvitationEmail({
      to: email,
      inviteeName,
      inviteCode,
      portalUrl: portalUrl || "https://thanarah.com",
      expiresAt,
      inviterName: systemUser.fullName,
    });

    await Invitation.findByIdAndUpdate(invitation._id, { status: "sent" });

    return `
*✅ دعوة أُرسلت بنجاح!*
${SEP}
👤 *${inviteeName}*
📧 ${email}
🔑 الكود: \`${inviteCode}\`
📅 تنتهي: ${dateLabel(expiresAt)}
🎯 الدور: ${roleLabel("investor")}
${SEP}
_✉️ تم إرسال بريد الدعوة_`.trim();
  } catch (err: any) {
    // Email failed — keep invitation but flag it, still return the code
    await Invitation.findByIdAndUpdate(invitation._id, { status: "failed_delivery" });
    logger.error({ err, email }, "WA bot: invitation email delivery failed");

    return `
*⚠️ الدعوة أُنشئت لكن فشل إرسال البريد*
${SEP}
👤 *${inviteeName}*
📧 ${email}
🔑 الكود: \`${inviteCode}\`
📅 تنتهي: ${dateLabel(expiresAt)}
${SEP}
_❌ تحقق من إعدادات SMTP_
_أرسل الكود يدوياً للمستخدم_`.trim();
  }
}

// ── بريد مخصص ─────────────────────────────────────────────────────────────────

async function cmdSendEmail(args: string[]): Promise<string> {
  if (args.length < 2) {
    return `⚠️ *الاستخدام:* بريد email الرسالة\n_مثال: بريد ahmed@co.com موعدك غداً الساعة 10_`;
  }

  const email = args[0].toLowerCase().trim();
  if (!EMAIL_RE.test(email)) {
    return `❌ *البريد الإلكتروني غير صحيح:* ${email}`;
  }

  const message = args.slice(1).join(" ").trim();

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F7F5F1;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:#0F3D33;padding:28px 40px;">
    <p style="color:#A9CBB5;font-size:22px;font-weight:700;margin:0;letter-spacing:1px;">ثناره</p>
    <p style="color:#A9CBB5;font-size:11px;letter-spacing:3px;margin:4px 0 0;">Thanarah — Technology Serving People</p>
  </div>
  <div style="padding:36px 48px;">
    <div style="border-right:4px solid #1E6B4D;padding-right:20px;">
      <p style="font-size:16px;line-height:1.85;margin:0;color:#1A1A1A;">${message.replace(/\n/g, "<br/>")}</p>
    </div>
  </div>
  <div style="background:#F7F5F1;border-top:1px solid #E5E2DC;padding:20px 40px;text-align:center;color:#6B7280;font-size:12px;">
    <strong style="color:#0F3D33;">ثناره — تقنية تخدم الإنسان</strong><br/>
    © 2026 Thanarah Team. All rights reserved.
  </div>
</div>
</body></html>`;

  try {
    await sendEmail({
      to: email,
      subject: "رسالة من فريق ثناره",
      html,
      text: message,
    });
    return `✅ تم إرسال البريد إلى *${email}* بنجاح ✉️`;
  } catch (err: any) {
    logger.error({ err, email }, "WA bot: manual email delivery failed");
    return `❌ فشل إرسال البريد إلى *${email}*\n_تحقق من إعدادات SMTP_`;
  }
}

// ── حسابات واتساب من قاعدة البيانات ──────────────────────────────────────────

async function cmdWaAccounts(): Promise<string> {
  await connectDb();

  // Avoid circular import — dynamic import of the model only when called
  const { default: WhatsAppAccount } = await import("../models/whatsappAccount.js");

  const accounts = await (WhatsAppAccount as any)
    .find()
    .select("name phone enabled autoReplyEnabled responseTopics adminUsers")
    .lean();

  if (!accounts || accounts.length === 0) {
    return `📱 لا توجد أرقام واتساب مهيأة في قاعدة البيانات بعد.\nأضفها من لوحة التحكم ← واتساب.`;
  }

  const lines = accounts.map((acc: any) => {
    const status  = acc.enabled ? "🟢 مفعّل" : "🔴 موقوف";
    const ai      = acc.autoReplyEnabled ? "🤖 رد تلقائي: نعم" : "✋ رد تلقائي: لا";
    const topics  = acc.responseTopics?.length ? `📌 ${acc.responseTopics.join("، ")}` : "";
    const admins  = acc.adminUsers?.length
      ? acc.adminUsers.map((u: any) => `   👤 ${u.name} (+${u.phone}) ${u.enabled ? "✅" : "⛔"}`).join("\n")
      : "   لا يوجد أدمن محدد";
    return [
      `*${acc.name}*`,
      `📞 +${acc.phone || "غير محدد"}`,
      status,
      ai,
      topics,
      `*المستخدمون المسؤولون:*\n${admins}`,
    ].filter(Boolean).join("\n");
  }).join(`\n${SEP}\n`);

  return `*📱 حسابات واتساب المهيأة (${accounts.length})*\n${SEP}\n\n${lines}\n${SEP}\n_🕒 ${now()}_`;
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

/**
 * Parse and execute an admin command from WhatsApp.
 * Returns the reply string, or a "command not found" hint if unrecognized.
 */
export async function handleAdminCommand(body: string): Promise<string> {
  const parts = body.trim().split(/\s+/);
  const cmd   = parts[0];
  const args  = parts.slice(1);

  try {
    // Help
    if (["مساعدة", "help", "الأوامر", "commands", "اوامر", "?", "؟"].includes(cmd)) {
      return cmdHelp();
    }
    // Status
    if (["حالة", "status", "الحالة"].includes(cmd)) {
      return cmdStatus();
    }
    // Full report
    if (["تقرير", "report", "احصائيات", "إحصائيات", "stats"].includes(cmd)) {
      return cmdReport();
    }
    // Users
    if (["مستخدمين", "users", "المستخدمين"].includes(cmd)) {
      return cmdUsers();
    }
    // Invitations list
    if (["دعوات", "invitations", "الدعوات", "invites"].includes(cmd)) {
      return cmdInvitations();
    }
    // Sessions
    if (["جلسات", "sessions", "الجلسات"].includes(cmd)) {
      return cmdSessions();
    }
    // Audit log
    if (["سجل", "log", "logs", "audit", "احداث", "أحداث"].includes(cmd)) {
      return cmdAuditLog();
    }
    // Create invitation + send email
    if (["دعوة", "دعوه", "invite"].includes(cmd)) {
      return cmdInvite(args, true);
    }
    // Quick code — no email
    if (["كود", "code", "quick"].includes(cmd)) {
      return cmdInvite(args, false);
    }
    // Send custom email
    if (["بريد", "email", "ايميل", "إيميل", "mail"].includes(cmd)) {
      return cmdSendEmail(args);
    }
    // WhatsApp accounts from DB
    if (["حسابات", "ارقام", "أرقام", "accounts", "phones"].includes(cmd)) {
      return cmdWaAccounts();
    }
    // Ping
    if (["ping", "بينق", "اختبار", "test"].includes(cmd)) {
      return `🟢 *بوت ثناره يعمل بشكل طبيعي*\n_🕒 ${now()}_`;
    }

    // Unrecognized
    return `❓ أمر غير معروف: *${cmd}*\n\nاكتب *مساعدة* لعرض جميع الأوامر المتاحة.`;
  } catch (err: any) {
    logger.error({ err, cmd, args }, "WA admin command error");
    return `❌ *خطأ في تنفيذ الأمر*\n\`${err?.message ?? "خطأ غير معروف"}\`\n\nاكتب *مساعدة* للمساعدة.`;
  }
}
