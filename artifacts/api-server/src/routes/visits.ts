import { Router, type Response, type Request } from "express";
import { authenticate, type AuthRequest, ADMIN_ROLES } from "../lib/auth";
import VisitRequest from "../models/visitRequest";
import { logAudit } from "../models/auditLog";
import { sendVisitRequestConfirmation, sendVisitRequestAdminNotification } from "../lib/email";
import { connectDb } from "../lib/db";

const router = Router();

// GET /api/visits — admin only
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const visits = await VisitRequest.find({}).sort({ requestedAt: -1 }).lean();
  res.json(visits.map(formatVisit));
});

// POST /api/visits — public
router.post("/", async (req: Request, res: Response) => {
  await connectDb();
  const { fullName, phone, email, reason, visitorType } = req.body;

  if (!fullName || !phone || !email || !reason || !visitorType) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  const visit = await VisitRequest.create({ fullName, phone, email, reason, visitorType });

  // Send confirmation to visitor
  await sendVisitRequestConfirmation({ to: email, name: fullName });

  // Notify admin owners
  const ownerEmails = [
    process.env.THANARAH_OWNER_EMAIL_1,
    process.env.THANARAH_OWNER_EMAIL_2,
  ].filter(Boolean) as string[];

  for (const adminEmail of ownerEmails) {
    await sendVisitRequestAdminNotification({
      to: adminEmail,
      visitorName: fullName,
      visitorEmail: email,
      visitorPhone: phone,
      reason,
      visitorType,
    });
  }

  res.status(201).json({ success: true, message: "Visit request submitted" });
});

// POST /api/visits/:id/approve
router.post("/:id/approve", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const visit = await VisitRequest.findByIdAndUpdate(
    req.params.id,
    { status: "approved", reviewedBy: req.userId, reviewedAt: new Date() },
    { new: true },
  );

  if (!visit) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await logAudit({ actor: req.userId!, action: "visit_request.approved", targetId: String(req.params["id"]), result: "success", riskScore: "low", ipAddress: String(req.ip || ""), timestamp: new Date() });

  res.json({ success: true, message: "Visit request approved" });
});

// POST /api/visits/:id/reject
router.post("/:id/reject", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { reason } = req.body;
  const visit = await VisitRequest.findByIdAndUpdate(
    req.params.id,
    { status: "rejected", rejectionReason: reason, reviewedBy: req.userId, reviewedAt: new Date() },
    { new: true },
  );

  if (!visit) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ success: true, message: "Visit request rejected" });
});

function formatVisit(v: any) {
  return {
    id: v._id.toString(),
    fullName: v.fullName,
    phone: v.phone,
    email: v.email,
    reason: v.reason,
    visitorType: v.visitorType,
    status: v.status,
    requestedAt: v.requestedAt?.toISOString(),
    scheduledAt: v.scheduledAt?.toISOString() ?? null,
  };
}

export default router;
