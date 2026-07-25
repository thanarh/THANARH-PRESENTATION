/**
 * AI tool definitions and executors — gives the WhatsApp assistant real capabilities:
 * - send_link: return a portal/page URL
 * - create_invitation: create an invite code in DB and optionally email it
 * - send_welcome_email: send a branded welcome email to a given address
 */

import crypto from "crypto";
import { connectDb } from "../lib/db";
import { sendEmail, sendInvitationEmail } from "../lib/email";
import Invitation from "../models/invitation";
import User from "../models/user";
import { logger } from "../lib/logger";

const PORTAL_URL =
  process.env.BASE_URL?.replace(/\/$/, "") ?? "https://presentation.thanarah.com";

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
        "Creates a real invitation code in the system so the person can access the Thanarah portal. Use when the user asks for an invite, access link, or invitation code.",
      parameters: {
        type: "object",
        properties: {
          name:       { type: "string", description: "Full name of the invitee" },
          email:      { type: "string", description: "Email address of the invitee" },
          phone:      { type: "string", description: "Optional phone number" },
          send_email: { type: "boolean", description: "Whether to also email the invitation to them (default true)" },
        },
        required: ["name", "email"],
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
  logger.info({ tool: name, args }, "Executing AI tool");

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
      : null;

    const rawToken  = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    const expiresAt  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await Invitation.create({
      inviteeName: args.name,
      email:       args.email,
      phone:       args.phone ?? undefined,
      tokenHash,
      inviteCode,
      role:                    "investor",
      expiresAt,
      maxLogins:               10,
      maxDevices:              2,
      sessionDurationMinutes:  120,
      allowFullScreen:         true,
      createdBy:               owner?._id ?? undefined,
      status:                  "sent",
    });

    const sendEmail_ = args.send_email !== false;
    if (sendEmail_) {
      try {
        await sendInvitationEmail({
          to:          args.email,
          inviteeName: args.name,
          inviteCode,
          portalUrl:   PORTAL_URL,
          expiresAt,
          inviterName: "فريق ثناره",
        });
      } catch (err) {
        logger.warn({ err }, "Failed to send invitation email — code still created");
      }
    }

    const link = `${PORTAL_URL}/join?code=${inviteCode}`;
    return [
      `✅ تم إنشاء كود الدعوة لـ ${args.name}`,
      ``,
      `🔑 كود الدخول: *${inviteCode}*`,
      `🔗 رابط مباشر: ${link}`,
      ``,
      `صالح لمدة 7 أيام.${sendEmail_ ? ` تم إرسال الدعوة أيضاً إلى ${args.email} 📧` : ""}`,
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
