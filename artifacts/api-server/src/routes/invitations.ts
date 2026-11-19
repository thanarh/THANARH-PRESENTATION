import { Router, type Request, type Response } from "express";
import {
  authenticate,
  type AuthRequest,
  ADMIN_ROLES,
  generateSecureToken,
  generateSessionCode,
  hashToken,
  signAccessToken,
  signRefreshToken,
} from "../lib/auth";
import Invitation, { type InvitationStatus } from "../models/invitation";
import User from "../models/user";
import Session from "../models/session";
import WaOtp, { verifyWaOtp, normalizePhone } from "../models/waOtp";
import { logAudit } from "../models/auditLog";
import { sendInvitationEmail, sendAdminInvitationNotification } from "../lib/email";
import { clearInvitationOtp, createInvitationOtp, getInvitationOtpState } from "../lib/invitation-otp";
import {
  isQiroxOtpConfigured,
  notifyWaInvitationLink,
  notifyWaInvitationSent,
  notifyWaOtp,
} from "../lib/waNotify";
import { connectDb } from "../lib/db";
import { getPortalBaseUrl } from "../lib/portal-url";
import { logger } from "../lib/logger";
import bcrypt from "bcryptjs";
import { z } from "zod";

const router = Router();
const ACTIVE_INVITATION_STATUSES: InvitationStatus[] = ["draft", "sent", "opened", "failed_delivery"];

function normalizeInvitePhone(value: unknown): string | null {
  let phone = String(value ?? "").trim().replace(/[\s().-]/g, "");
  if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
  if (/^05\d{8}$/.test(phone)) phone = `+966${phone.slice(1)}`;
  else if (/^5\d{8}$/.test(phone)) phone = `+966${phone}`;
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}

function maskPhone(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return `•••• ${digits.slice(-4)}`;
}

async function findInvitationForToken(token: unknown) {
  if (typeof token !== "string" || token.length < 32 || token.length > 256) return null;
  const invitation = await Invitation.findOne({ tokenHash: hashToken(token) });
  if (!invitation || !ACTIVE_INVITATION_STATUSES.includes(invitation.status)) return null;
  if (invitation.expiresAt <= new Date()) {
    invitation.status = "expired";
    await invitation.save();
    return null;
  }
  if (invitation.startsAt && invitation.startsAt > new Date()) return null;
  return invitation;
}

async function deliverInvitation(
  invitation: any,
  rawToken: string,
  inviterName: string,
  requestOrigin?: string,
) {
  const baseUrl = getPortalBaseUrl(requestOrigin);
  const inviteUrl = `${baseUrl}/invite#${rawToken}`;
  let whatsappDelivered = false;
  let emailDelivered = false;
  const errorMessages: string[] = [];
  const code = await createInvitationOtp(invitation.phone, invitation._id);
  try {
    await notifyWaInvitationLink(invitation.phone, invitation.inviteeName, inviteUrl, code);
    whatsappDelivered = true;
  } catch (err) {
    await clearInvitationOtp(invitation.phone, invitation._id);
    logger.warn({ err, invitationId: invitation._id }, "Invitation WhatsApp delivery failed");
    errorMessages.push("تعذر إرسال واتساب");
  }
  if (whatsappDelivered) {
    await Invitation.findByIdAndUpdate(invitation._id, { tokenHash: hashToken(rawToken) });
  }
  if (invitation.email) {
    try {
      await sendInvitationEmail({
        to: invitation.email,
        inviteeName: invitation.inviteeName,
        inviteUrl,
        expiresAt: invitation.expiresAt,
        inviterName,
        customMessage: invitation.customMessage,
      });
      emailDelivered = true;
      if (!whatsappDelivered) {
        await Invitation.findByIdAndUpdate(invitation._id, { tokenHash: hashToken(rawToken) });
      }
    } catch (err) {
      logger.warn({ err, invitationId: invitation._id }, "Invitation email delivery failed");
      errorMessages.push("تعذر إرسال البريد");
    }
  }
  const emailStatus = invitation.email
    ? (emailDelivered ? "sent" : "failed")
    : "skipped";
  const status = whatsappDelivered || emailDelivered ? "sent" : "failed_delivery";
  const update: Record<string, unknown> = {
    status,
    whatsappDeliveryStatus: whatsappDelivered ? "sent" : "failed",
    emailDeliveryStatus: emailStatus,
  };
  await Invitation.findByIdAndUpdate(invitation._id, update);
  const adminEmails = [
    process.env.THANARAH_OWNER_EMAIL_1 || process.env.ADMIN_NOTIFY_EMAIL_1 || "youssefd.business@gmail.com",
    process.env.THANARAH_OWNER_EMAIL_2 || process.env.ADMIN_NOTIFY_EMAIL_2 || "faisal.m.alenzai@gmail.com",
  ].filter(Boolean) as string[];
  void sendAdminInvitationNotification({
    adminEmails,
    inviteeName: invitation.inviteeName,
    inviteeEmail: invitation.email,
    inviteePhone: invitation.phone,
    deliveryStatus: `واتساب: ${whatsappDelivered ? "تم" : "فشل"}، البريد: ${emailStatus === "sent" ? "تم" : emailStatus === "failed" ? "فشل" : "غير مطلوب"}`,
    role: invitation.role,
    expiresAt: invitation.expiresAt,
    inviterName,
  }).catch((err) => logger.warn({ err }, "Admin invitation notification failed"));

  return {
    whatsappDelivered,
    emailDelivered,
    deliveryError: errorMessages.join("، ") || null,
  };
}

// GET /api/invitations
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  // Non-owners can only see their own invitations
  if (req.userRole === "admin") {
    filter.createdBy = req.userId;
  }

  const [data, total] = await Promise.all([
    Invitation.find(filter)
      .populate("createdBy", "fullName email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Invitation.countDocuments(filter),
  ]);

  res.json({ data: data.map(formatInvitation), total, page, totalPages: Math.ceil(total / limit) });
});

// GET /api/invitations/stats
router.get("/stats", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [active, expired, revoked, unopened, failedAttempts, total] = await Promise.all([
    Invitation.countDocuments({ status: "active" }),
    Invitation.countDocuments({ status: "expired" }),
    Invitation.countDocuments({ status: "revoked" }),
    Invitation.countDocuments({ status: "sent" }),
    Invitation.countDocuments({ status: "failed_delivery" }),
    Invitation.countDocuments({}),
  ]);

  res.json({ active, expired, revoked, unopened, failedAttempts, total });
});

// POST /api/invitations/validate — the raw invitation token stays out of URLs.
router.post("/validate", async (req: Request, res: Response) => {
  await connectDb();
  const invitation = await findInvitationForToken(req.body?.token);
  if (!invitation) {
    res.status(404).json({ error: "رابط الدعوة غير صالح أو منتهي الصلاحية" });
    return;
  }
  invitation.status = "opened";
  await invitation.save();
  const inviter = await User.findById(invitation.createdBy).select("fullName").lean();
  const otpState = invitation.phone
    ? await getInvitationOtpState(invitation.phone, invitation._id)
    : { available: false, resendIn: 0 };
  res.json({
    inviteeName: invitation.inviteeName,
    email: invitation.email ?? null,
    phone: maskPhone(invitation.phone),
    role: invitation.role,
    expiresAt: invitation.expiresAt.toISOString(),
    allowedSections: invitation.allowedSections,
    inviterName: inviter?.fullName || "فريق ثناره",
    otpAvailable: otpState.available,
    otpResendIn: otpState.resendIn,
  });
});

// POST /api/invitations/otp/send — send an invitation-bound OTP through QIROX WhatsApp.
router.post("/otp/send", async (req: Request, res: Response) => {
  await connectDb();
  const invitation = await findInvitationForToken(req.body?.token);
  if (!invitation?.phone) {
    res.status(404).json({ error: "رابط الدعوة غير صالح أو لا يحتوي على رقم جوال" });
    return;
  }
  if (!isQiroxOtpConfigured()) {
    res.status(503).json({ error: "خدمة إرسال رمز واتساب غير مهيأة حالياً" });
    return;
  }
  const phone = normalizePhone(invitation.phone);
  const otpState = await getInvitationOtpState(phone, invitation._id);
  if (otpState.resendIn > 0) {
    res.status(429).json({
      error: `انتظر ${otpState.resendIn} ثانية قبل طلب رمز جديد`,
      retryAfterSeconds: otpState.resendIn,
    });
    return;
  }
  const code = await createInvitationOtp(phone, invitation._id);
  try {
    await notifyWaOtp(phone, code, "ar", invitation.inviteeName, "invitation");
  } catch (err) {
    await clearInvitationOtp(phone, invitation._id);
    logger.error({ err, invitationId: invitation.id }, "Failed to send invitation OTP");
    res.status(502).json({ error: "تعذّر إرسال رمز التحقق عبر واتساب" });
    return;
  }
  res.json({ success: true, message: "أرسلنا رمز التحقق إلى رقم الجوال المدعو" });
});

// POST /api/invitations
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const {
    inviteeName, email, phone, role, allowedSections, permissions, startsAt,
    expiresAt, maxLogins, maxDevices, sessionDurationMinutes, allowComments,
    allowFullScreen, allowViewFinancials, customMessage, reason,
  } = req.body;
  const normalizedPhone = normalizeInvitePhone(phone);
  const normalizedEmail = typeof email === "string" && email.trim()
    ? email.trim().toLowerCase()
    : undefined;
  const expiryDate = new Date(expiresAt);

  if (!inviteeName?.trim() || !normalizedPhone || !role || !expiresAt || Number.isNaN(expiryDate.getTime())) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    res.status(400).json({ error: "البريد الإلكتروني غير صحيح" });
    return;
  }
  if (expiryDate <= new Date()) {
    res.status(400).json({ error: "تاريخ انتهاء الدعوة يجب أن يكون في المستقبل" });
    return;
  }

  const phoneDigits = normalizePhone(normalizedPhone);
  const phonePattern = new RegExp(`${phoneDigits}$`);
  if (await User.findOne({ phone: { $regex: phonePattern } })) {
    res.status(409).json({ error: "يوجد حساب مرتبط بهذا الرقم بالفعل" });
    return;
  }
  if (normalizedEmail && await User.findOne({ email: normalizedEmail })) {
    res.status(409).json({ error: "يوجد حساب مرتبط بهذا البريد بالفعل" });
    return;
  }
  const pendingInvite = await Invitation.findOne({
    phone: normalizedPhone,
    status: { $in: ["draft", "sent", "opened", "failed_delivery"] },
    expiresAt: { $gt: new Date() },
  });
  if (pendingInvite) {
    res.status(409).json({ error: "توجد دعوة سارية لهذا الرقم بالفعل. أعد إرسالها من قائمة الدعوات." });
    return;
  }

  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);

  const invitation = await Invitation.create({
    inviteeName: String(inviteeName).trim(),
    email: normalizedEmail,
    phone: normalizedPhone,
    tokenHash,
    role,
    permissions: permissions || [],
    allowedSections: allowedSections || [],
    startsAt: startsAt ? new Date(startsAt) : undefined,
    expiresAt: expiryDate,
    maxLogins: maxLogins || 5,
    maxDevices: maxDevices || 2,
    sessionDurationMinutes: sessionDurationMinutes || 60,
    allowComments: allowComments ?? false,
    allowFullScreen: allowFullScreen ?? true,
    allowViewFinancials: allowViewFinancials ?? false,
    customMessage,
    reason,
    createdBy: req.userId,
    status: "draft",
    whatsappDeliveryStatus: "pending",
    emailDeliveryStatus: normalizedEmail ? "pending" : "skipped",
  });

  const creator = await User.findById(req.userId).lean();
  const delivery = await deliverInvitation(
    invitation,
    rawToken,
    creator?.fullName || "فريق ثناره",
    req.get("origin"),
  );

  if (creator?.phone) {
    void notifyWaInvitationSent(creator.phone, inviteeName, role).catch(() => {});
  }

  await logAudit({
    actor: creator?.fullName || req.userId!,
    actorId: invitation.createdBy,
    action: "invitation.created",
    targetId: String(invitation._id),
    result: delivery.whatsappDelivered || delivery.emailDelivered ? "success" : "failure",
    riskScore: "low",
    ipAddress: String(req.ip || ""),
    timestamp: new Date(),
  });

  const updated = await Invitation.findById(invitation._id).populate("createdBy", "fullName").lean();
  res.status(201).json({
    ...formatInvitation(updated!),
    _whatsappDelivered: delivery.whatsappDelivered,
    _emailDelivered: delivery.emailDelivered,
    _deliveryError: delivery.deliveryError,
  });
});

// GET /api/invitations/:id
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const invitation = await Invitation.findById(req.params.id).populate("createdBy", "fullName email").lean();
  if (!invitation) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatInvitation(invitation));
});

// PATCH /api/invitations/:id
router.patch("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const updated = await Invitation.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).lean();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatInvitation(updated));
});

// POST /api/invitations/:id/revoke
router.post("/:id/revoke", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { reason } = req.body;
  if (!reason) {
    res.status(400).json({ error: "Reason required" });
    return;
  }
  await Invitation.findByIdAndUpdate(req.params.id, { status: "revoked", revokedBy: req.userId, revokeReason: reason });
  await logAudit({ actor: req.userId!, action: "invitation.revoked", targetId: String(req.params["id"]), result: "success", riskScore: "low", ipAddress: String(req.ip || ""), timestamp: new Date() });
  res.json({ success: true, message: "Invitation revoked" });
});

// POST /api/invitations/:id/extend
router.post("/:id/extend", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const { newExpiresAt, reason } = req.body;
  const invitation = await Invitation.findById(req.params.id);
  if (!invitation) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  invitation.extendHistory.push({
    previousExpiry: invitation.expiresAt,
    newExpiry: new Date(newExpiresAt),
    reason,
    changedBy: req.userId as unknown as import("mongoose").Types.ObjectId,
    changedAt: new Date(),
  });
  invitation.expiresAt = new Date(newExpiresAt);
  if (invitation.status === "expired") invitation.status = "active";
  await invitation.save();

  await logAudit({ actor: req.userId!, action: "invitation.extended", targetId: String(req.params["id"]), result: "success", riskScore: "low", ipAddress: String(req.ip || ""), timestamp: new Date() });

  res.json(formatInvitation(invitation.toObject()));
});

// POST /api/invitations/:id/resend
router.post("/:id/resend", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const invitation = await Invitation.findById(req.params.id).lean();
  if (!invitation) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (!invitation.phone || invitation.expiresAt <= new Date() || ["revoked", "active", "used"].includes(invitation.status)) {
    res.status(400).json({ error: "لا يمكن إعادة إرسال هذه الدعوة. تحقق من رقم الجوال وحالة الدعوة." });
    return;
  }
  const creator = await User.findById(req.userId).lean();
  const rawToken = generateSecureToken();
  await Invitation.findByIdAndUpdate(req.params.id, {
    status: "draft",
    whatsappDeliveryStatus: "pending",
    emailDeliveryStatus: invitation.email ? "pending" : "skipped",
  });
  const delivery = await deliverInvitation(
    invitation,
    rawToken,
    creator?.fullName || "فريق ثناره",
    req.get("origin"),
  );
  res.json({ success: delivery.whatsappDelivered || delivery.emailDelivered, ...delivery });
});

// POST /api/invitations/accept — verify invitation-bound OTP and create the session.
router.post("/accept", async (req: Request, res: Response) => {
  await connectDb();
  const schema = z.object({
    token: z.string().min(32).max(256),
    otp: z.string().regex(/^\d{6}$/),
    password: z.string().min(8).max(128).optional(),
    acceptedTerms: z.literal(true),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "أدخل رمز التحقق ووافق على اتفاقية السرية" });
    return;
  }

  const invitation = await findInvitationForToken(parsed.data.token);
  if (!invitation?.phone) {
    res.status(404).json({ error: "رابط الدعوة غير صالح أو منتهي الصلاحية" });
    return;
  }
  if (invitation.email && !parsed.data.password) {
    res.status(400).json({ error: "أضف كلمة مرور لتفعيل الدخول بالبريد الإلكتروني" });
    return;
  }
  if (!invitation.email && parsed.data.password) {
    res.status(400).json({ error: "لا يمكن إضافة كلمة مرور من دون بريد إلكتروني" });
    return;
  }

  const phoneDigits = normalizePhone(invitation.phone);
  const phonePattern = new RegExp(`${phoneDigits}$`);
  const existingUser = await User.findOne({
    $or: [
      { phone: { $regex: phonePattern } },
      ...(invitation.email ? [{ email: invitation.email }] : []),
    ],
  });
  if (existingUser) {
    res.status(409).json({ error: "يوجد حساب مرتبط بهذا الجوال أو البريد. تواصل مع المسؤول." });
    return;
  }

  const otpRecord = await WaOtp.findOne({
    phone: phoneDigits,
    purpose: "invitation",
    invitationId: invitation._id,
  });
  if (!otpRecord) {
    res.status(400).json({ error: "اطلب رمز تحقق جديداً قبل تفعيل الدعوة" });
    return;
  }
  if (otpRecord.attempts >= 3) {
    await otpRecord.deleteOne();
    res.status(429).json({ error: "تجاوزت الحد المسموح. اطلب رمزاً جديداً." });
    return;
  }
  if (!verifyWaOtp(parsed.data.otp, otpRecord.otpHash)) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    res.status(401).json({ error: `رمز غير صحيح. المحاولات المتبقية: ${3 - otpRecord.attempts}` });
    return;
  }

  const activationFilter = {
    _id: invitation._id,
    tokenHash: hashToken(parsed.data.token),
    status: { $in: ACTIVE_INVITATION_STATUSES },
    expiresAt: { $gt: new Date() },
  };
  const lockedInvitation = await Invitation.findOneAndUpdate(
    activationFilter as any,
    { $set: { status: "registration_started" } },
    { new: true },
  );
  if (!lockedInvitation) {
    res.status(409).json({ error: "هذه الدعوة قيد الاستخدام أو لم تعد متاحة" });
    return;
  }

  await otpRecord.deleteOne();
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  const ua = req.headers["user-agent"] || "";
  try {
    const user = await User.create({
      fullName: invitation.inviteeName,
      ...(invitation.email ? { email: invitation.email, passwordHash: await bcrypt.hash(parsed.data.password!, 12) } : {}),
      phone: invitation.phone,
      role: invitation.role as any,
      status: "active" as const,
      emailVerified: false,
      permissions: invitation.permissions,
      allowedSections: invitation.allowedSections,
      invitationId: invitation._id,
    });

    const sessionCode = generateSessionCode();
    const sessionToken = generateSecureToken();
    const refreshToken = generateSecureToken();
    const durationMinutes = Math.max(5, invitation.sessionDurationMinutes || 60);
    const expiresAt = new Date(Date.now() + durationMinutes * 60_000);
    const session = await Session.create({
      userId: user._id,
      invitationId: invitation._id,
      sessionTokenHash: hashToken(sessionToken),
      refreshTokenHash: hashToken(refreshToken),
      sessionCode,
      ipAddress: ip,
      userAgent: ua,
      deviceType: /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop",
      expiresAt,
    });
    const payload = { userId: user.id, sessionId: session.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshJwt = signRefreshToken(payload);

    await Invitation.findByIdAndUpdate(invitation._id, {
      status: "active",
      usedCount: invitation.usedCount + 1,
    });
    await logAudit({
      actor: user.fullName,
      actorId: user._id as any,
      action: "invitation.accepted",
      targetId: String(invitation._id),
      result: "success",
      riskScore: "low",
      ipAddress: ip,
      sessionId: session.id,
      timestamp: new Date(),
    });

    res.json({
      accessToken,
      refreshToken: refreshJwt,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions,
        allowedSections: user.allowedSections,
        preferredLanguage: user.preferredLanguage,
        mfaEnabled: user.mfaEnabled,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        sessionExpiresAt: expiresAt.toISOString(),
      },
      requiresMfa: false,
      mfaSessionToken: null,
    });
  } catch (err) {
    await Invitation.findByIdAndUpdate(invitation._id, { status: "opened" });
    logger.error({ err, invitationId: invitation.id }, "Invitation activation failed");
    res.status(500).json({ error: "تعذر تفعيل الحساب الآن. أعد المحاولة أو اطلب رابطاً جديداً." });
  }
});

function formatInvitation(inv: any) {
  return {
    id: inv._id?.toString(),
    inviteeName: inv.inviteeName,
    email: inv.email ?? null,
    phone: inv.phone ?? null,
    whatsappDeliveryStatus: inv.whatsappDeliveryStatus ?? "pending",
    emailDeliveryStatus: inv.emailDeliveryStatus ?? "skipped",
    role: inv.role,
    status: inv.status,
    allowedSections: inv.allowedSections || [],
    permissions: inv.permissions || [],
    startsAt: inv.startsAt?.toISOString() ?? null,
    expiresAt: inv.expiresAt?.toISOString(),
    maxLogins: inv.maxLogins,
    maxDevices: inv.maxDevices,
    usedCount: inv.usedCount,
    sessionDurationMinutes: inv.sessionDurationMinutes,
    allowComments: inv.allowComments,
    allowFullScreen: inv.allowFullScreen,
    allowViewFinancials: inv.allowViewFinancials,
    customMessage: inv.customMessage ?? null,
    createdBy: typeof inv.createdBy === "object" ? inv.createdBy?.fullName || inv.createdBy?.toString() : inv.createdBy?.toString(),
    createdAt: inv.createdAt?.toISOString(),
    updatedAt: inv.updatedAt?.toISOString(),
  };
}

export default router;
