import { Router, type Response } from "express";
import { authenticate, type AuthRequest, ADMIN_ROLES } from "../lib/auth";
import AuditLog from "../models/auditLog";
import SecurityEvent from "../models/securityEvent";
import PresentationSection from "../models/presentationSection";
import Session from "../models/session";
import User from "../models/user";
import Invitation from "../models/invitation";
import BlockedIp from "../models/blockedIp";
import VisitRequest from "../models/visitRequest";
import { logAudit } from "../models/auditLog";
import { connectDb } from "../lib/db";
import mongoose from "mongoose";

const router = Router();

function requireAdmin(req: AuthRequest, res: Response): boolean {
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

// GET /api/admin/dashboard
router.get("/dashboard", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!requireAdmin(req, res)) return;

  const [totalUsers, activeInvitations, activeSessions, pendingVisitRequests, recentSecurityEvents, totalAuditLogs] = await Promise.all([
    User.countDocuments({}),
    Invitation.countDocuments({ status: "active" }),
    Session.countDocuments({ status: "active" }),
    VisitRequest.countDocuments({ status: "pending" }),
    SecurityEvent.countDocuments({ resolved: false, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
    AuditLog.countDocuments({}),
  ]);

  res.json({ totalUsers, activeInvitations, activeSessions, pendingVisitRequests, recentSecurityEvents, totalAuditLogs, systemStatus: "operational" });
});

// GET /api/admin/audit-logs
router.get("/audit-logs", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!requireAdmin(req, res)) return;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const actorId = req.query.actorId as string;
  const action = req.query.action as string;

  const filter: Record<string, unknown> = {};
  if (actorId) filter.actorId = new mongoose.Types.ObjectId(actorId);
  if (action) filter.action = { $regex: action, $options: "i" };

  const [data, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);

  const formatted = data.map((log) => ({
    id: log._id.toString(),
    actor: log.actor,
    actorId: log.actorId?.toString() ?? null,
    action: log.action,
    target: log.target ?? null,
    targetId: log.targetId ?? null,
    result: log.result,
    riskScore: log.riskScore,
    ipAddress: log.ipAddress,
    sessionId: log.sessionId ?? null,
    metadata: log.metadata ?? {},
    timestamp: log.timestamp.toISOString(),
  }));

  res.json({ data: formatted, total, page, totalPages: Math.ceil(total / limit) });
});

// GET /api/admin/security-events
router.get("/security-events", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!requireAdmin(req, res)) return;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const severity = req.query.severity as string;
  const resolved = req.query.resolved;

  const filter: Record<string, unknown> = {};
  if (severity) filter.severity = severity;
  if (resolved !== undefined) filter.resolved = resolved === "true";

  const [data, total] = await Promise.all([
    SecurityEvent.find(filter).populate("userId", "fullName email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    SecurityEvent.countDocuments(filter),
  ]);

  const formatted = data.map((e) => ({
    id: e._id.toString(),
    type: e.type,
    severity: e.severity,
    userId: e.userId?.toString() ?? null,
    userName: (e.userId as any)?.fullName ?? null,
    ipAddress: e.ipAddress,
    description: e.description,
    resolved: e.resolved,
    resolvedBy: e.resolvedBy?.toString() ?? null,
    createdAt: e.createdAt.toISOString(),
  }));

  res.json({ data: formatted, total, page });
});

// POST /api/admin/security-events/:id/resolve
router.post("/security-events/:id/resolve", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!requireAdmin(req, res)) return;

  await SecurityEvent.findByIdAndUpdate(req.params.id, { resolved: true, resolvedBy: req.userId, resolvedAt: new Date() });
  res.json({ success: true, message: "Event resolved" });
});

// GET /api/admin/content
router.get("/content", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!requireAdmin(req, res)) return;

  const sections = await PresentationSection.find({}).populate("updatedBy", "fullName").sort({ order: 1 }).lean();

  const formatted = sections.map((s) => ({
    id: s._id.toString(),
    slug: s.slug,
    titleAr: s.titleAr,
    titleEn: s.titleEn,
    status: s.status,
    order: s.order,
    updatedAt: s.updatedAt.toISOString(),
    updatedBy: (s.updatedBy as any)?.fullName || "System",
  }));

  res.json(formatted);
});

// POST /api/admin/content
router.post("/content", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!requireAdmin(req, res)) return;

  const { slug, titleAr, titleEn, descriptionAr, descriptionEn, content, order, requiredPermission, audience } = req.body;
  if (!slug || !titleAr || !titleEn) {
    res.status(400).json({ error: "slug, titleAr, and titleEn are required" });
    return;
  }

  const section = await PresentationSection.create({ slug, titleAr, titleEn, descriptionAr, descriptionEn, content: content || {}, order: order || 0, requiredPermission, audience: audience || [], updatedBy: req.userId });

  await logAudit({ actor: req.userId!, action: "content.created", target: slug, result: "success", riskScore: "low", ipAddress: String(req.ip || ""), timestamp: new Date() });

  res.status(201).json({ id: section._id.toString(), slug: section.slug, titleAr: section.titleAr, titleEn: section.titleEn, status: section.status, order: section.order, updatedAt: section.updatedAt.toISOString(), updatedBy: req.userId! });
});

// PATCH /api/admin/content/:id
router.patch("/content/:id", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!requireAdmin(req, res)) return;

  const { titleAr, titleEn, descriptionAr, descriptionEn, content, order, status, requiredPermission } = req.body;
  const updates: Record<string, unknown> = { updatedBy: req.userId };
  if (titleAr !== undefined) updates.titleAr = titleAr;
  if (titleEn !== undefined) updates.titleEn = titleEn;
  if (descriptionAr !== undefined) updates.descriptionAr = descriptionAr;
  if (descriptionEn !== undefined) updates.descriptionEn = descriptionEn;
  if (content !== undefined) updates.content = content;
  if (order !== undefined) updates.order = order;
  if (status !== undefined) updates.status = status;
  if (requiredPermission !== undefined) updates.requiredPermission = requiredPermission;

  const section = await PresentationSection.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).lean();
  if (!section) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await logAudit({ actor: req.userId!, action: "content.updated", targetId: String(req.params["id"]), result: "success", riskScore: "low", ipAddress: String(req.ip || ""), timestamp: new Date() });

  res.json({ id: section._id.toString(), slug: section.slug, titleAr: section.titleAr, titleEn: section.titleEn, status: section.status, order: section.order, updatedAt: section.updatedAt.toISOString(), updatedBy: req.userId! });
});

// POST /api/admin/content/publish
router.post("/content/publish", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!requireAdmin(req, res)) return;

  await PresentationSection.updateMany({ status: "draft" }, { $set: { status: "published", publishedAt: new Date() } });
  await logAudit({ actor: req.userId!, action: "content.published", result: "success", riskScore: "low", ipAddress: String(req.ip || ""), timestamp: new Date() });

  res.json({ success: true, message: "Content published" });
});

// POST /api/admin/versions/:id/restore — placeholder
router.post("/versions/:id/restore", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!requireAdmin(req, res)) return;
  res.json({ success: true, message: "Version restored (not yet implemented)" });
});

// GET /api/admin/system-health
router.get("/system-health", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!requireAdmin(req, res)) return;

  let dbStatus = "operational";
  try {
    await mongoose.connection.db!.admin().ping();
  } catch {
    dbStatus = "degraded";
  }

  const activeSessions = await Session.countDocuments({ status: "active" });

  res.json({
    api: "operational",
    database: dbStatus,
    email: "operational",
    activeSessions,
    uptime: Math.floor(process.uptime()),
    lastBackup: null,
  });
});

// POST /api/admin/blocked-ips
router.post("/blocked-ips", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!requireAdmin(req, res)) return;

  const { ipAddress, reason, expiresAt } = req.body;
  if (!ipAddress || !reason) {
    res.status(400).json({ error: "ipAddress and reason required" });
    return;
  }

  await BlockedIp.findOneAndUpdate(
    { ipAddress },
    { reason, blockedBy: req.userId, expiresAt: expiresAt ? new Date(expiresAt) : undefined },
    { upsert: true },
  );

  await logAudit({ actor: req.userId!, action: "security.ip_blocked", target: ipAddress, result: "success", riskScore: "high", ipAddress: String(req.ip || ""), timestamp: new Date() });

  res.json({ success: true, message: "IP blocked" });
});

export default router;
