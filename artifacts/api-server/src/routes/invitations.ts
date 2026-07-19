import { Router, type Response } from "express";
import { authenticate, type AuthRequest, ADMIN_ROLES } from "../lib/auth";
import { generateSecureToken, hashToken } from "../lib/auth";
import Invitation from "../models/invitation";
import User from "../models/user";
import { logAudit } from "../models/auditLog";
import { sendInvitationEmail } from "../lib/email";
import { connectDb } from "../lib/db";
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

  const { inviteeName, email, role, allowedSections, permissions, startsAt, expiresAt, maxLogins, maxDevices, sessionDurationMinutes, allowComments, allowFullScreen, allowViewFinancials, customMessage, reason } = req.body;

  if (!inviteeName || !email || !role || !expiresAt) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);

  const invitation = await Invitation.create({
    inviteeName,
    email,
    tokenHash,
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
  const inviteUrl = `${baseUrl}/invite/${rawToken}`;

  await sendInvitationEmail({
    to: email,
    inviteeName,
    inviteUrl,
    expiresAt: new Date(expiresAt),
    inviterName: creator?.fullName || "Thanarah Team",
    customMessage,
  });

  await Invitation.findByIdAndUpdate(invitation._id, { status: "sent" });

  await logAudit({ actor: creator?.fullName || req.userId!, actorId: invitation.createdBy, action: "invitation.created", target: email, result: "success", riskScore: "low", ipAddress: String(req.ip || ""), timestamp: new Date() });

  const updated = await Invitation.findById(invitation._id).populate("createdBy", "fullName").lean();
  res.status(201).json(formatInvitation(updated!));
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
  await Invitation.findByIdAndUpdate(req.params.id, { tokenHash, status: "sent" });

  const baseUrl = process.env.BASE_URL || "https://presentation.thanarah.com";
  await sendInvitationEmail({
    to: invitation.email,
    inviteeName: invitation.inviteeName,
    inviteUrl: `${baseUrl}/invite/${rawToken}`,
    expiresAt: invitation.expiresAt,
    inviterName: creator?.fullName || "Thanarah Team",
    customMessage: invitation.customMessage,
  });

  res.json({ success: true, message: "Invitation resent" });
});

// POST /api/invitations/accept
router.post("/accept", async (req: any, res: Response) => {
  await connectDb();
  const { token, password, acceptedTerms } = req.body;

  if (!token || !password || !acceptedTerms) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const tokenHash = hashToken(token);
  const invitation = await Invitation.findOne({ tokenHash });

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
