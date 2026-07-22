import { Router, type Response } from "express";
import { authenticate, type AuthRequest, ADMIN_ROLES } from "../lib/auth";
import { generateSecureToken, hashToken } from "../lib/auth";
import crypto from "crypto";

function generateInviteCode(): string {
  // Format: XXXX-XXXX (8 uppercase alphanumeric chars)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous I/1/O/0
  let code = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
    if (i === 3) code += "-";
  }
  return code;
}
import Invitation from "../models/invitation";
import User from "../models/user";
import { logAudit } from "../models/auditLog";
import { sendInvitationEmail, sendAdminInvitationNotification } from "../lib/email";
import { connectDb } from "../lib/db";
import { logger } from "../lib/logger";
import bcrypt from "bcryptjs";

const router = Router();

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

// GET /api/invitations/validate-code/:code  (public — used by the invite page)
router.get("/validate-code/:code", async (req: any, res: Response) => {
  await connectDb();
  const code = (req.params.code as string).toUpperCase().replace(/\s/g, "");
  const invitation = await Invitation.findOne({ inviteCode: code }).populate("createdBy", "fullName").lean();

  if (!invitation || invitation.status === "revoked" || invitation.status === "expired") {
    res.status(404).json({ error: "كود الدعوة غير صحيح أو منتهي الصلاحية" });
    return;
  }

  if (new Date() > invitation.expiresAt) {
    await Invitation.findByIdAndUpdate(invitation._id, { status: "expired" });
    res.status(404).json({ error: "انتهت صلاحية كود الدعوة" });
    return;
  }

  if (invitation.status === "active") {
    res.status(400).json({ error: "تم استخدام هذه الدعوة مسبقاً" });
    return;
  }

  res.json({
    inviteCode: code,
    inviteeName: invitation.inviteeName,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt.toISOString(),
    allowedSections: invitation.allowedSections,
    inviterName: (invitation.createdBy as any)?.fullName || "Thanarah Team",
  });
});

// GET /api/invitations/validate/:token
router.get("/validate/:token", async (req: any, res: Response) => {
  await connectDb();
  const { token } = req.params;
  const tokenHash = hashToken(token);
  const invitation = await Invitation.findOne({ tokenHash }).populate("createdBy", "fullName").lean();

  if (!invitation || invitation.status === "revoked" || invitation.status === "expired") {
    res.status(404).json({ error: "Invalid or expired invitation" });
    return;
  }

  if (new Date() > invitation.expiresAt) {
    await Invitation.findByIdAndUpdate(invitation._id, { status: "expired" });
    res.status(404).json({ error: "Invitation expired" });
    return;
  }

  res.json({
    inviteeName: invitation.inviteeName,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt.toISOString(),
    allowedSections: invitation.allowedSections,
    requiresMfa: false,
    inviterName: (invitation.createdBy as any)?.fullName || "Thanarah Team",
  });
});

// POST /api/invitations
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { inviteeName, email, phone, role, allowedSections, permissions, startsAt, expiresAt, maxLogins, maxDevices, sessionDurationMinutes, allowComments, allowFullScreen, allowViewFinancials, customMessage, reason } = req.body;

  if (!inviteeName || !email || !role || !expiresAt) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const inviteCode = generateInviteCode();

  const invitation = await Invitation.create({
    inviteeName,
    email,
    phone: phone ? String(phone).trim() : undefined,
    tokenHash,
    inviteCode,
    role,
    permissions: permissions || [],
    allowedSections: allowedSections || [],
    startsAt: startsAt ? new Date(startsAt) : undefined,
    expiresAt: new Date(expiresAt),
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
  });

  const creator = await User.findById(req.userId).lean();
  const baseUrl = process.env.BASE_URL || "https://presentation.thanarah.com";
  const portalUrl = `${baseUrl}/invite`;

  let emailDelivered = true;
  let emailError: string | null = null;

  const ADMIN_NOTIFY_EMAILS = [
    process.env.THANARAH_OWNER_EMAIL_1 || process.env.ADMIN_NOTIFY_EMAIL_1 || "youssefd.business@gmail.com",
    process.env.THANARAH_OWNER_EMAIL_2 || process.env.ADMIN_NOTIFY_EMAIL_2 || "faisal.m.alenzai@gmail.com",
  ].filter(Boolean) as string[];

  try {
    await sendInvitationEmail({
      to: email,
      inviteeName,
      inviteCode,
      portalUrl,
      expiresAt: new Date(expiresAt),
      inviterName: creator?.fullName || "Thanarah Team",
      customMessage,
    });
    await Invitation.findByIdAndUpdate(invitation._id, { status: "sent" });

    // Notify admins — fire and forget (don't block the response)
    sendAdminInvitationNotification({
      adminEmails: ADMIN_NOTIFY_EMAILS,
      inviteeName,
      inviteeEmail: email,
      inviteePhone: phone ? String(phone) : undefined,
      inviteCode,
      role,
      expiresAt: new Date(expiresAt),
      inviterName: creator?.fullName || "Thanarah Team",
    }).catch(err => logger.warn({ err }, "Admin notification failed (non-critical)"));
  } catch (err: unknown) {
    emailDelivered = false;
    emailError = err instanceof Error ? err.message : "Unknown email error";
    logger.error({ err, invitationId: invitation._id, to: email }, "Failed to send invitation email — marked as failed_delivery");
    await Invitation.findByIdAndUpdate(invitation._id, { status: "failed_delivery" });
  }

  await logAudit({ actor: creator?.fullName || req.userId!, actorId: invitation.createdBy, action: "invitation.created", target: email, result: "success", riskScore: "low", ipAddress: String(req.ip || ""), timestamp: new Date() });

  const updated = await Invitation.findById(invitation._id).populate("createdBy", "fullName").lean();
  res.status(201).json({
    ...formatInvitation(updated!),
    _emailDelivered: emailDelivered,
    _emailError: emailError,
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
  const creator = await User.findById(req.userId).lean();
  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const newCode = generateInviteCode();
  // Generate fresh token + code before attempting email
  await Invitation.findByIdAndUpdate(req.params.id, { tokenHash, inviteCode: newCode, status: "draft" });

  const baseUrl = process.env.BASE_URL || "https://presentation.thanarah.com";
  try {
    await sendInvitationEmail({
      to: invitation.email,
      inviteeName: invitation.inviteeName,
      inviteCode: newCode,
      portalUrl: `${baseUrl}/invite`,
      expiresAt: invitation.expiresAt,
      inviterName: creator?.fullName || "Thanarah Team",
      customMessage: invitation.customMessage,
    });
    await Invitation.findByIdAndUpdate(req.params.id, { status: "sent" });
    res.json({ success: true, message: "Invitation resent" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown email error";
    logger.error({ err, invitationId: req.params.id, to: invitation.email }, "Failed to resend invitation email");
    await Invitation.findByIdAndUpdate(req.params.id, { status: "failed_delivery" });
    res.status(502).json({ error: "Invitation saved but email delivery failed. Check SMTP settings.", detail: msg });
  }
});

// POST /api/invitations/accept
router.post("/accept", async (req: any, res: Response) => {
  await connectDb();
  const { inviteCode, password, acceptedTerms, phone } = req.body;

  if (!inviteCode || !password || !acceptedTerms) {
    res.status(400).json({ error: "جميع الحقول مطلوبة" });
    return;
  }

  const code = (inviteCode as string).toUpperCase().replace(/\s/g, "");
  const invitation = await Invitation.findOne({ inviteCode: code });

  if (!invitation || invitation.status === "revoked") {
    res.status(400).json({ error: "Invalid invitation" });
    return;
  }

  if (new Date() > invitation.expiresAt) {
    await Invitation.findByIdAndUpdate(invitation._id, { status: "expired" });
    res.status(400).json({ error: "Invitation expired" });
    return;
  }

  const existingUser = await User.findOne({ email: invitation.email });
  if (existingUser) {
    res.status(400).json({ error: "Account already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    fullName: invitation.inviteeName,
    email: invitation.email,
    passwordHash,
    role: invitation.role as any,
    status: "active" as const,
    emailVerified: true,
    permissions: invitation.permissions,
    allowedSections: invitation.allowedSections,
    invitationId: invitation._id,
    ...(phone ? { phone: String(phone).trim() } : {}),
  });

  await Invitation.findByIdAndUpdate(invitation._id, {
    status: "active",
    usedCount: invitation.usedCount + 1,
  });

  res.json({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, permissions: user.permissions, allowedSections: user.allowedSections, preferredLanguage: user.preferredLanguage, mfaEnabled: user.mfaEnabled, lastLoginAt: null, sessionExpiresAt: null },
    requiresMfa: false,
    mfaSessionToken: null,
  });
});

function formatInvitation(inv: any) {
  return {
    id: inv._id?.toString(),
    inviteeName: inv.inviteeName,
    email: inv.email,
    inviteCode: inv.inviteCode ?? null,
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
