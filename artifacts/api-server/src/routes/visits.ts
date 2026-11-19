import { Router, type Response, type Request } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import Invitation from "../models/invitation";
import { authenticate, type AuthRequest, ADMIN_ROLES } from "../lib/auth";
import VisitRequest from "../models/visitRequest";
import User from "../models/user";
import { sendVisitRequestConfirmation, sendVisitRequestAdminNotification } from "../lib/email";
import { connectDb } from "../lib/db";
import { normalizePhoneE164, phoneLookupValues } from "../lib/phone";
import { listConfiguredPhoneAdmins } from "../lib/admin-phone-access";
import { whatsappService } from "../services/whatsapp";
import { decideVisitRequest } from "../services/visit-approval";
import { logger } from "../lib/logger";
import { notifyQiroxMessage } from "../lib/waNotify";

const router = Router();
const visitRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "وصلت إلى الحد المسموح من الطلبات. حاول مرة أخرى لاحقاً." },
});

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
router.post("/", visitRequestLimiter, async (req: Request, res: Response) => {
  await connectDb();
  const schema = z.object({
    fullName: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(32),
    email: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
    reason: z.string().trim().min(10).max(2000),
    visitorType: z.string().trim().min(1).max(60),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "تحقق من الاسم ورقم الجوال وسبب الزيارة، والبريد إن أُدخل." });
    return;
  }

  const phone = normalizePhoneE164(parsed.data.phone);
  if (!phone) {
    res.status(400).json({ error: "أدخل رقم الجوال مع مفتاح الدولة، مثل +966 أو +20." });
    return;
  }

  const normalizedEmail = parsed.data.email?.trim().toLowerCase() || undefined;
  const phoneMatches = phoneLookupValues(phone);
  const [existingUser, existingInvitation, existingRequest] = await Promise.all([
    User.findOne({ phone: { $in: phoneMatches } }).select("_id status"),
    Invitation.findOne({
      phone: { $in: phoneMatches },
      status: { $in: ["draft", "scheduled", "sent", "opened", "failed_delivery"] },
      expiresAt: { $gt: new Date() },
    }).select("_id"),
    VisitRequest.findOne({ phone: { $in: phoneMatches }, status: "pending" }).select("_id"),
  ]);
  if (existingUser || existingInvitation) {
    res.status(409).json({ error: "يوجد حساب أو دعوة مرتبطة بهذا الرقم. استخدم رابط الدعوة أو سجّل الدخول." });
    return;
  }
  if (existingRequest) {
    res.status(409).json({ error: "لديك طلب زيارة قيد المراجعة بالفعل." });
    return;
  }

  const visit = await VisitRequest.create({
    fullName: parsed.data.fullName,
    phone,
    email: normalizedEmail,
    reason: parsed.data.reason,
    visitorType: parsed.data.visitorType,
    notificationDeliveryStatus: "pending",
  });

  if (normalizedEmail) {
    void sendVisitRequestConfirmation({ to: normalizedEmail, name: parsed.data.fullName }).catch((err) => {
      logger.warn(
        { requestId: String(visit._id), errorName: err instanceof Error ? err.name : "unknown" },
        "Visit request email confirmation failed",
      );
    });
  }

  const admins = await listConfiguredPhoneAdmins();
  const approvalMessage = [
    "*طلب زيارة جديد — ثناره*",
    `رقم الطلب: ${String(visit._id).slice(-6).toUpperCase()}`,
    `الاسم: ${visit.fullName}`,
    `الجوال: ${visit.phone}`,
    `النوع: ${visit.visitorType}`,
    `سبب الزيارة: ${visit.reason}`,
    "الحالة: قيد المراجعة",
    "",
    "للموافقة، رُدّ على هذه الرسالة بالرقم 1.",
    "للرفض، رُدّ على هذه الرسالة بالرقم 2.",
    "إذا كان لديك أكثر من طلب، أرسل الرقم وآخر 6 أحرف من رقم الطلب، مثل: 1 ABC123.",
  ].join("\n");
  let deliveredCount = 0;

  for (const admin of admins) {
    const jid = `${admin.phone.replace(/\D/g, "")}@s.whatsapp.net`;
    let messageId: string | null = null;
    try {
      messageId = await whatsappService.sendMessage(jid, approvalMessage);
    } catch (baileysError) {
      try {
        await notifyQiroxMessage(admin.phone, approvalMessage, admin.name);
        messageId = `qirox-${visit._id}`;
      } catch (qiroxError) {
        logger.warn(
          {
            requestId: String(visit._id),
            baileysErrorName: baileysError instanceof Error ? baileysError.name : "unknown",
            qiroxErrorName: qiroxError instanceof Error ? qiroxError.name : "unknown",
          },
          "Visit request WhatsApp admin notification failed",
        );
      }
    }

    if (!messageId) continue;
    deliveredCount += 1;
    try {
      await VisitRequest.findByIdAndUpdate(visit._id, {
        $push: {
          approvalMessages: {
            adminPhone: admin.phone,
            messageId,
            sentAt: new Date(),
          },
        },
      });
    } catch (err) {
      logger.warn(
        { requestId: String(visit._id), errorName: err instanceof Error ? err.name : "unknown" },
        "Visit request approval message reference could not be saved",
      );
    }
  }

  const notificationDeliveryStatus = deliveredCount === 0
    ? "failed"
    : deliveredCount === admins.length
      ? "sent"
      : "partial";
  await VisitRequest.findByIdAndUpdate(visit._id, { notificationDeliveryStatus });

  // Keep the existing email fallback for owner addresses when configured.
  const ownerEmails = [
    process.env.THANARAH_OWNER_EMAIL_1,
    process.env.THANARAH_OWNER_EMAIL_2,
  ].filter(Boolean) as string[];

  for (const adminEmail of ownerEmails) {
    void sendVisitRequestAdminNotification({
      to: adminEmail,
      visitorName: visit.fullName,
      visitorEmail: normalizedEmail || "غير متاح",
      visitorPhone: phone,
      reason: visit.reason,
      visitorType: visit.visitorType,
    }).catch((err) => logger.warn(
      { requestId: String(visit._id), errorName: err instanceof Error ? err.name : "unknown" },
      "Visit request admin email notification failed",
    ));
  }

  res.status(201).json({
    success: true,
    message: "تم استلام طلبك، وسيتم مراجعته من المسؤولين.",
    notificationDeliveryStatus,
  });
});

// POST /api/visits/:id/approve
router.post("/:id/approve", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const reviewer = await User.findById(req.userId).select("fullName phone").lean();
  const result = await decideVisitRequest({
    requestId: String(req.params.id),
    decision: "approved",
    actor: {
      userId: req.userId,
      name: reviewer?.fullName || "مسؤول ثناره",
      phone: reviewer?.phone,
      ipAddress: String(req.ip || ""),
    },
    requestOrigin: req.get("origin"),
  });
  if (result.outcome === "not_found") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (result.outcome === "already_decided") {
    res.status(409).json({ error: "تمت مراجعة هذا الطلب بالفعل." });
    return;
  }
  res.json({
    success: true,
    message: result.invitationDeliveryStatus === "sent"
      ? "تمت الموافقة وإرسال رابط الدعوة ورمز التحقق."
      : "تمت الموافقة، لكن فشل إرسال الدعوة. أعد المحاولة من هذه الصفحة.",
  });
});

// POST /api/visits/:id/reject
router.post("/:id/reject", authenticate, async (req: AuthRequest, res: Response) => {
  await connectDb();
  if (!ADMIN_ROLES.includes(req.userRole!)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const schema = z.object({ reason: z.string().trim().max(500).optional() });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: "سبب الرفض غير صحيح" });
    return;
  }
  const reviewer = await User.findById(req.userId).select("fullName phone").lean();
  const result = await decideVisitRequest({
    requestId: String(req.params.id),
    decision: "rejected",
    actor: {
      userId: req.userId,
      name: reviewer?.fullName || "مسؤول ثناره",
      phone: reviewer?.phone,
      ipAddress: String(req.ip || ""),
    },
    rejectionReason: parsed.data.reason,
  });
  if (result.outcome === "not_found") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (result.outcome === "already_decided") {
    res.status(409).json({ error: "تمت مراجعة هذا الطلب بالفعل." });
    return;
  }
  res.json({
    success: true,
    message: result.applicantNotificationStatus === "sent"
      ? "تم رفض الطلب وإبلاغ مقدم الطلب."
      : "تم رفض الطلب، لكن تعذّر إرسال إشعار لمقدم الطلب.",
  });
});

function formatVisit(v: any) {
  return {
    id: v._id.toString(),
    fullName: v.fullName,
    phone: v.phone,
    email: v.email ?? null,
    reason: v.reason,
    visitorType: v.visitorType,
    status: v.status,
    rejectionReason: v.rejectionReason ?? null,
    reviewedByName: v.reviewedByName ?? null,
    invitationDeliveryStatus: v.invitationDeliveryStatus ?? null,
    applicantNotificationStatus: v.applicantNotificationStatus ?? null,
    notificationDeliveryStatus: v.notificationDeliveryStatus ?? null,
    requestedAt: v.requestedAt?.toISOString(),
    scheduledAt: v.scheduledAt?.toISOString() ?? null,
  };
}

export default router;
