import { Router, type Response } from "express";
import bcrypt from "bcryptjs";
import { authenticate, type AuthRequest, ADMIN_ROLES } from "../lib/auth";
import User from "../models/user";
import Session from "../models/session";
import { logAudit } from "../models/auditLog";
import { connectDb } from "../lib/db";

const router = Router();

// GET /api/users
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const role = req.query.role as string;

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;

  const [data, total] = await Promise.all([
    User.find(filter, "-passwordHash -mfaSecret -emailVerificationCode -passwordResetToken")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    data: data.map(formatUser),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// POST /api/users
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { fullName, email, role, password } = req.body;
  if (!fullName || !email || !role || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409).json({ error: "Email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ fullName, email, passwordHash, role, status: "active", emailVerified: true });

  await logAudit({ actor: req.userId!, action: "user.created", target: email, result: "success", riskScore: "low", ipAddress: String(req.ip || ""), timestamp: new Date() });
  res.status(201).json(formatUser(user.toObject()));
});

// GET /api/users/:id
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!) && req.userId !== req.params.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const user = await User.findById(req.params.id, "-passwordHash -mfaSecret").lean();
  if (!user) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatUser(user));
});

// PATCH /api/users/:id
router.patch("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!) && req.userId !== req.params.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const allowed = ["fullName", "role", "preferredLanguage"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, projection: "-passwordHash -mfaSecret" }).lean();
  if (!user) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await logAudit({ actor: req.userId!, action: "user.updated", targetId: String(req.params["id"]), result: "success", riskScore: "low", ipAddress: String(req.ip || ""), timestamp: new Date() });
  res.json(formatUser(user));
});

// POST /api/users/:id/disable
router.post("/:id/disable", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await User.findByIdAndUpdate(req.params.id, { status: "disabled" });
  await Session.updateMany({ userId: req.params.id, status: "active" }, { status: "revoked", revokedAt: new Date() });
  await logAudit({ actor: req.userId!, action: "user.disabled", targetId: String(req.params["id"]), result: "success", riskScore: "medium", ipAddress: String(req.ip || ""), timestamp: new Date() });
  res.json({ success: true, message: "User disabled" });
});

// POST /api/users/:id/force-logout
router.post("/:id/force-logout", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await Session.updateMany({ userId: req.params.id, status: "active" }, { status: "revoked", revokedAt: new Date(), revokedBy: req.userId });
  await logAudit({ actor: req.userId!, action: "user.force_logout", targetId: String(req.params["id"]), result: "success", riskScore: "medium", ipAddress: String(req.ip || ""), timestamp: new Date() });
  res.json({ success: true, message: "All sessions revoked" });
});

function formatUser(u: any) {
  return {
    id: u._id?.toString(),
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    status: u.status,
    mfaEnabled: u.mfaEnabled,
    preferredLanguage: u.preferredLanguage || "ar",
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt?.toISOString(),
    invitationId: u.invitationId?.toString() ?? null,
  };
}

export default router;
