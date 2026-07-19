import { Router, type Response } from "express";
import { authenticate, type AuthRequest } from "../lib/auth";
import PresentationSection from "../models/presentationSection";
import Session from "../models/session";
import { logAudit } from "../models/auditLog";
import { connectDb } from "../lib/db";

const router = Router();

// GET /api/presentation/sections
router.get("/sections", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();

  // Get user's session to know allowed sections
  const session = await Session.findById(req.sessionId).lean();
  const user = req as any;

  const sections = await PresentationSection.find({ status: "published" })
    .sort({ order: 1 })
    .lean();

  const formatted = sections.map((s) => ({
    id: s._id.toString(),
    slug: s.slug,
    titleAr: s.titleAr,
    titleEn: s.titleEn,
    order: s.order,
    status: s.status,
    requiredPermission: s.requiredPermission ?? null,
    isLocked: false,
    hasViewed: session?.visitedSections?.includes(s.slug) ?? false,
  }));

  res.json(formatted);
});

// GET /api/presentation/sections/:slug
router.get("/sections/:slug", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  const section = await PresentationSection.findOne({ slug: req.params.slug, status: "published" }).lean();

  if (!section) {
    res.status(404).json({ error: "Section not found or not published" });
    return;
  }

  await logAudit({ actor: req.userId!, action: "presentation.section_viewed", target: String(req.params["slug"]), result: "success", riskScore: "low", ipAddress: String(req.ip || ""), sessionId: req.sessionId, timestamp: new Date() });

  // Track in session
  await Session.findByIdAndUpdate(req.sessionId, { $addToSet: { visitedSections: req.params.slug }, lastActivityAt: new Date() });

  res.json({
    id: section._id.toString(),
    slug: section.slug,
    titleAr: section.titleAr,
    titleEn: section.titleEn,
    descriptionAr: section.descriptionAr ?? null,
    descriptionEn: section.descriptionEn ?? null,
    content: section.content || {},
    order: section.order,
    status: section.status,
    updatedAt: section.updatedAt.toISOString(),
  });
});

// GET /api/presentation/progress
router.get("/progress", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  const session = await Session.findById(req.sessionId).lean();
  const totalSections = await PresentationSection.countDocuments({ status: "published" });

  const visitedSections = session?.visitedSections || [];
  const completionPercent = totalSections > 0 ? Math.round((visitedSections.length / totalSections) * 100) : 0;

  res.json({
    visitedSections,
    lastSection: visitedSections[visitedSections.length - 1] ?? null,
    totalSections,
    completionPercent,
  });
});

// POST /api/presentation/progress
router.post("/progress", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  const { sectionSlug } = req.body;
  if (!sectionSlug) {
    res.status(400).json({ error: "sectionSlug required" });
    return;
  }

  await Session.findByIdAndUpdate(req.sessionId, { $addToSet: { visitedSections: sectionSlug }, lastActivityAt: new Date() });

  res.json({ success: true, message: "Progress saved" });
});

export default router;
