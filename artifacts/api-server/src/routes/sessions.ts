import { Router, type Response } from "express";
import { authenticate, type AuthRequest, ADMIN_ROLES } from "../lib/auth";
import Session from "../models/session";
import User from "../models/user";
import { logAudit } from "../models/auditLog";
import { connectDb } from "../lib/db";

const router = Router();

// GET /api/sessions
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();

  const filter: Record<string, unknown> = { status: "active" };

  // Non-admins see only their own sessions
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    filter.userId = req.userId;
  }

  const sessions = await Session.find(filter)
    .populate("userId", "fullName email")
    .sort({ lastActivityAt: -1 })
    .lean();

  const formatted = sessions.map((s) => ({
    id: s._id.toString(),
    userId: s.userId.toString(),
    userName: (s.userId as any)?.fullName || "Unknown",
    ipAddress: s.ipAddress,
    country: s.country ?? null,
    userAgent: s.userAgent,
    deviceType: s.deviceType,
    startedAt: s.startedAt.toISOString(),
    lastActivityAt: s.lastActivityAt.toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    riskScore: s.riskScore,
    status: s.status,
  }));

  res.json(formatted);
});

// DELETE /api/sessions/:id
router.delete("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();

  const session = await Session.findById(req.params.id);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  // Allow admins or the session owner to revoke
  if (!ADMIN_ROLES.includes(req.userRole!) && session.userId.toString() !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await Session.findByIdAndUpdate(req.params.id, { status: "revoked", revokedAt: new Date(), revokedBy: req.userId });

  await logAudit({ actor: req.userId!, action: "session.revoked", targetId: String(req.params["id"]), result: "success", riskScore: "low", ipAddress: String(req.ip || ""), timestamp: new Date() });

  res.json({ success: true, message: "Session revoked" });
});

export default router;
