/**
 * AI tool definitions and executors — gives the WhatsApp assistant real capabilities:
 * - send_link: return a portal/page URL
 * - create_invitation: send a phone-bound invitation link and OTP activation
 * - send_welcome_email: send a branded welcome email to a given address
 */

import crypto from "crypto";
import { connectDb } from "../lib/db";
import { sendEmail, sendInvitationEmail } from "../lib/email";
import Invitation from "../models/invitation";
import User from "../models/user";
import { logger } from "../lib/logger";
import { notifyWaInvitationLink } from "../lib/waNotify";
import { clearInvitationOtp, createInvitationOtp } from "../lib/invitation-otp";
import { getPortalBaseUrl } from "../lib/portal-url";

const PORTAL_URL = getPortalBaseUrl();

// ── Page map ──────────────────────────────────────────────────────────────────
const PAGE_MAP: Record<string, string> = {
  home:       "/",
  whatsapp:   "/#whatsapp",
  pricing:    "/#pricing",
  features:   "/#features",
  contact:    "/#contact",
  about:      "/#about",
};

// ── Tool definitions (OpenAI function-calling schema) ─────────────────────────
export const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "send_link",
      description:
        "Returns the Thanarah portal URL or a specific page URL when the user asks for a link or asks about a topic that has a page.",
      parameters: {
        type: "object",
        properties: {
          page: {
            type: "string",
            enum: ["home", "whatsapp", "pricing", "features", "contact", "about"],
            description: "Which page to link to. Omit or use 'home' for the main portal link.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_invitation",
      description:
        "Creates a phone-bound Thanarah portal invitation and sends the activation link by WhatsApp. Email is optional.",
      parameters: {
        type: "object",
        properties: {
          name:       { type: "string", description: "Full name of the invitee" },
          email:      { type: "string", description: "Optional email address for a second copy" },
          phone:      { type: "string", description: "International phone number, such as +966501234567" },
          send_email: { type: "boolean", description: "Whether to also email the link when an email is provided" },
        },
        required: ["name", "phone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_welcome_email",
      description:
        "Sends a warm welcome/introductory email to a given email address on behalf of Thanarah.",
      parameters: {
        type: "object",
        properties: {
          to_email: { type: "string", description: "Recipient email address" },
          to_name:  { type: "string", description: "Recipient name" },
          lang:     { type: "string", enum: ["ar", "en"], description: "Language of the email" },
        },
        required: ["to_email", "to_name"],
      },
    },
  },
];

// ── Tool executor ─────────────────────────────────────────────────────────────
export async function executeTool(name: string, args: Record<string, any>): Promise<string> {
  logger.info({ tool: name }, "Executing AI tool");

  // ── send_link ──────────────────────────────────────────────────────────────
  if (name === "send_link") {
    const page = (args.page as string | undefined)?.toLowerCase() ?? "home";
    const path = PAGE_MAP[page] ?? "/";
    return `${PORTAL_URL}${path}`;
  }

  // ── create_invitation ──────────────────────────────────────────────────────
  if (name === "create_invitation") {
    await connectDb();

    // Find system owner to use as createdBy
    const ownerEmail = process.env.THANARAH_OWNER_EMAIL_1;
    const owner = ownerEmail
      ? await User.findOne({ email: ownerEmail }).lean()
      : await User.findOne({ role: "owner", status: "active" }).lean();
    if (!owner) return "لا يوجد حساب مالك نشط لإنشاء الدعوة.";

    const phoneInput = String(args.phone ?? "").trim().replace(/[\s().-]/g, "");
    const phone = phoneInput.startsWith("00") ? `+${phoneInput.slice(2)}` : phoneInput;
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) return "أدخل رقم الجوال بصيغته الدولية، مثل +966501234567.";
    const email = typeof args.email === "string" && args.email.trim() ? args.email.trim().toLowerCase() : undefined;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "البريد الإلكتروني غير صحيح.";
    const phoneDigits = phone.replace(/\D/g, "");
    if (await User.findOne({ phone: { $regex: new RegExp(`${phoneDigits}$`) } })) {
      return "يوجد حساب مرتبط بهذا الرقم بالفعل.";
    }
    if (email && await User.findOne({ email })) return "يوجد حساب مرتبط بهذا البريد بالفعل.";
    if (await Invitation.findOne({
      phone,
      status: { $in: ["draft", "sent", "opened", "failed_delivery"] },
      expiresAt: { $gt: new Date() },
    })) return "توجد دعوة سارية لهذا الرقم بالفعل.";
    const rawToken  = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.create({
      inviteeName: args.name,
      email,
      phone,
      tokenHash,
      role:                    "investor",
      expiresAt,
      maxLogins:               10,
      maxDevices:              2,
      sessionDurationMinutes:  120,
      allowFullScreen:         true,
      createdBy:               owner._id,
      status:                  "draft",
      whatsappDeliveryStatus:  "pending",
      emailDeliveryStatus:     email ? "pending" : "skipped",
    });

    const inviteUrl = `${PORTAL_URL}/invite#${rawToken}`;
    const sendEmail_ = Boolean(email) && args.send_email !== false;
    const otpCode = await createInvitationOtp(phone, invitation._id);
    const [whatsappResult, emailResult] = await Promise.allSettled([
      notifyWaInvitationLink(phone, String(args.name), inviteUrl, otpCode),
      sendEmail_
        ? sendInvitationEmail({
            to: email!,
            inviteeName: String(args.name),
            inviteUrl,
            expiresAt,
            inviterName: "فريق ثناره",
          })
        : Promise.resolve(),
    ]);
    const whatsappDelivered = whatsappResult.status === "fulfilled";
    const emailDelivered = sendEmail_ && emailResult.status === "fulfilled";
    if (!whatsappDelivered) await clearInvitationOtp(phone, invitation._id);
    const emailStatus = !email ? "skipped" : emailDelivered ? "sent" : sendEmail_ ? "failed" : "skipped";
    await Invitation.findByIdAndUpdate(invitation._id, {
      status: whatsappDelivered || emailDelivered ? "sent" : "failed_delivery",
      whatsappDeliveryStatus: whatsappDelivered ? "sent" : "failed",
      emailDeliveryStatus: emailStatus,
    });
    if (!whatsappDelivered) logger.warn({ invitationId: invitation.id }, "AI-created invitation WhatsApp delivery failed");
    if (sendEmail_ && !emailDelivered) logger.warn({ invitationId: invitation.id }, "AI-created invitation email delivery failed");
    return [
      whatsappDelivered ? `✅ أُرسل رابط الدعوة إلى واتساب: ${args.name}` : `⚠️ حُفظت الدعوة لكن تعذر إرسال واتساب`,
      sendEmail_ ? (emailDelivered ? `📧 أُرسل رابط إضافي إلى ${email}` : `⚠️ تعذر إرسال نسخة البريد`) : "",
      "يُفعّل الحساب بعد إدخال رمز التحقق المرسل على الجوال.",
    ].join("\n");
  }

  // ── send_welcome_email ─────────────────────────────────────────────────────
  if (name === "send_welcome_email") {
    const isAr = args.lang !== "en";
    const subject = isAr ? `أهلاً بك في ثناره 🌟` : `Welcome to Thanarah 🌟`;
    const html = isAr
      ? `<div dir="rtl" style="font-family:Arial,sans-serif;color:#1a1a1a">
           <h2 style="color:#16a34a">أهلاً ${args.to_name} 👋</h2>
           <p>يسعدنا ترحيبك في <strong>ثناره</strong> — المنصة الطبية الذكية التي تربط العيادات بتقنيات الذكاء الاصطناعي.</p>
           <p>نحن هنا لمساعدتك في كل خطوة. لا تتردد في التواصل معنا.</p>
           <p><a href="${PORTAL_URL}" style="background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">زيارة المنصة</a></p>
           <p style="color:#666;margin-top:24px">مع تحيات فريق ثناره 💚</p>
         </div>`
      : `<div style="font-family:Arial,sans-serif;color:#1a1a1a">
           <h2 style="color:#16a34a">Hi ${args.to_name} 👋</h2>
           <p>Welcome to <strong>Thanarah</strong> — the smart medical platform connecting clinics with AI.</p>
           <p>We're here to help every step of the way. Don't hesitate to reach out!</p>
           <p><a href="${PORTAL_URL}" style="background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none">Visit Portal</a></p>
           <p style="color:#666;margin-top:24px">Best regards, Thanarah Team 💚</p>
         </div>`;

    await sendEmail({ to: args.to_email, subject, html });
    return `✅ تم إرسال البريد الترحيبي إلى ${args.to_email} بنجاح 📧`;
  }

  return "unknown tool";
}
