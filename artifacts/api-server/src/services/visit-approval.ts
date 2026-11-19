import { Types } from "mongoose";
import { generateSecureToken, hashToken } from "../lib/auth";
import { getConfiguredPhoneAdmin } from "../lib/admin-phone-access";
import { clearInvitationOtp, createInvitationOtp } from "../lib/invitation-otp";
import { logAudit } from "../models/auditLog";
import Invitation from "../models/invitation";
import User from "../models/user";
import VisitRequest from "../models/visitRequest";
import { normalizePhoneE164, phoneLookupValues } from "../lib/phone";
import { notifyQiroxMessage, notifyWaInvitationLink } from "../lib/waNotify";
import { getPortalBaseUrl } from "../lib/portal-url";
import { logger } from "../lib/logger";

export type VisitDecision = "approved" | "rejected";

export interface VisitDecisionActor {
  userId?: string;
  phone?: string;
  name: string;
  ipAddress?: string;
}

export function parseVisitDecisionText(text: string): VisitDecision | null {
  const normalized = text
    .trim()
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
  if (normalized === "1") return "approved";
  if (normalized === "2") return "rejected";
  return null;
}

async function sendApprovedInvitation(
  visit: any,
  actor: VisitDecisionActor,
  requestOrigin?: string,
): Promise<{ invitationId: Types.ObjectId; delivered: boolean }> {
  const actorUser = actor.userId ? await User.findById(actor.userId) : null;
  const creator = actorUser ?? await User.findOne({
    role: { $in: ["owner", "super_admin"] },
    status: "active",
  });
  if (!creator) throw new Error("No active invitation creator is available");

  const internalRef = `visit-request:${visit._id}`;
  await Invitation.updateMany(
    { internalRef, status: "failed_delivery" },
    { $set: { status: "revoked", revokeReason: "Superseded by delivery retry" } },
  );

  const rawToken = generateSecureToken();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const invitation = await Invitation.create({
    inviteeName: visit.fullName,
    email: visit.email || undefined,
    phone: visit.phone,
    tokenHash: hashToken(rawToken),
    role: "viewer",
    permissions: [],
    allowedSections: [],
    expiresAt,
    maxLogins: 5,
    maxDevices: 2,
    sessionDurationMinutes: 60,
    allowComments: false,
    allowFullScreen: true,
    allowViewFinancials: false,
    createdBy: creator._id,
    status: "draft",
    whatsappDeliveryStatus: "pending",
    emailDeliveryStatus: "skipped",
    reason: `Approved visit request ${visit._id}`,
    internalRef,
  });

  try {
    const code = await createInvitationOtp(visit.phone, invitation._id);
    const inviteUrl = `${getPortalBaseUrl(requestOrigin)}/invite#${rawToken}`;
    await notifyWaInvitationLink(visit.phone, visit.fullName, inviteUrl, code);
    await Invitation.findByIdAndUpdate(invitation._id, {
      status: "sent",
      whatsappDeliveryStatus: "sent",
      emailDeliveryStatus: "skipped",
    });
    return { invitationId: invitation._id, delivered: true };
  } catch (error) {
    await clearInvitationOtp(visit.phone, invitation._id);
    await Invitation.findByIdAndUpdate(invitation._id, {
      status: "failed_delivery",
      whatsappDeliveryStatus: "failed",
      emailDeliveryStatus: "skipped",
    });
    logger.warn(
      {
        requestId: String(visit._id),
        errorName: error instanceof Error ? error.name : "unknown",
      },
      "Approved visit invitation delivery failed",
    );
    return { invitationId: invitation._id, delivered: false };
  }
}

async function sendRejectionNotice(visit: any): Promise<"sent" | "failed"> {
  try {
    const reason = visit.rejectionReason ? `\nسبب الرفض: ${visit.rejectionReason}` : "";
    await notifyQiroxMessage(
      visit.phone,
      `تمت مراجعة طلب الزيارة المقدم إلى ثناره، ونأسف لإبلاغك بأنه لم تتم الموافقة عليه.${reason}`,
      visit.fullName,
    );
    return "sent";
  } catch (error) {
    logger.warn(
      {
        requestId: String(visit._id),
        errorName: error instanceof Error ? error.name : "unknown",
      },
      "Visit rejection notice delivery failed",
    );
    return "failed";
  }
}

export async function decideVisitRequest(options: {
  requestId: string;
  decision: VisitDecision;
  actor: VisitDecisionActor;
  rejectionReason?: string;
  requestOrigin?: string;
}): Promise<{
  visit: any | null;
  outcome: "changed" | "already_decided" | "not_found";
  invitationDeliveryStatus?: "sent" | "failed";
  applicantNotificationStatus?: "sent" | "failed";
}> {
  const { requestId, decision, actor } = options;
  if (!Types.ObjectId.isValid(requestId)) {
    return { visit: null, outcome: "not_found" };
  }

  const current = await VisitRequest.findById(requestId);
  if (!current) return { visit: null, outcome: "not_found" };

  if (decision === "approved" && current.status === "approved" && current.invitationDeliveryStatus === "failed") {
    const delivery = await sendApprovedInvitation(current, actor, options.requestOrigin);
    current.invitationId = delivery.invitationId;
    current.invitationDeliveryStatus = delivery.delivered ? "sent" : "failed";
    await current.save();
    return {
      visit: current,
      outcome: "changed",
      invitationDeliveryStatus: current.invitationDeliveryStatus,
    };
  }

  if (current.status !== "pending") {
    return { visit: current, outcome: "already_decided" };
  }

  const set: Record<string, unknown> = {
    status: decision,
    reviewedByName: actor.name,
    reviewedByPhone: actor.phone,
    reviewedAt: new Date(),
  };
  if (actor.userId) set.reviewedBy = actor.userId;
  if (decision === "approved") {
    set.invitationDeliveryStatus = "pending";
    set.rejectionReason = undefined;
  } else {
    set.rejectionReason = options.rejectionReason?.trim() || "لم يذكر المسؤول سبباً إضافياً";
    set.applicantNotificationStatus = "pending";
  }

  const visit = await VisitRequest.findOneAndUpdate(
    { _id: requestId, status: "pending" },
    { $set: set },
    { new: true },
  );
  if (!visit) {
    const latest = await VisitRequest.findById(requestId);
    return { visit: latest, outcome: latest ? "already_decided" : "not_found" };
  }

  const action = decision === "approved" ? "visit_request.approved" : "visit_request.rejected";
  await logAudit({
    actor: actor.name,
    ...(actor.userId ? { actorId: actor.userId as any } : {}),
    action,
    targetId: requestId,
    result: "success",
    riskScore: "low",
    ipAddress: actor.ipAddress || "",
    timestamp: new Date(),
  });

  if (decision === "approved") {
    const delivery = await sendApprovedInvitation(visit, actor, options.requestOrigin);
    visit.invitationId = delivery.invitationId;
    visit.invitationDeliveryStatus = delivery.delivered ? "sent" : "failed";
    await visit.save();
    return {
      visit,
      outcome: "changed",
      invitationDeliveryStatus: visit.invitationDeliveryStatus,
    };
  }

  const notice = await sendRejectionNotice(visit);
  visit.applicantNotificationStatus = notice;
  await visit.save();
  return {
    visit,
    outcome: "changed",
    applicantNotificationStatus: notice,
  };
}

export async function handleVisitApprovalReply(options: {
  phone: string;
  body: string;
  quotedMessageId?: string | null;
}): Promise<{ handled: boolean; reply?: string }> {
  const decision = parseVisitDecisionText(options.body);
  const phone = normalizePhoneE164(options.phone);
  if (!decision || !phone || !(await getConfiguredPhoneAdmin(phone))) {
    return { handled: false };
  }

  let visit: any = null;
  if (options.quotedMessageId) {
    visit = await VisitRequest.findOne({
      approvalMessages: {
        $elemMatch: { adminPhone: phone, messageId: options.quotedMessageId },
      },
    });
  } else {
    const pending = await VisitRequest.find({
      status: "pending",
      "approvalMessages.adminPhone": phone,
    })
      .sort({ requestedAt: -1 })
      .limit(2);
    if (pending.length > 1) {
      return {
        handled: true,
        reply: "لديك أكثر من طلب معلّق. رُدّ مباشرة على رسالة الطلب المطلوب بالرقم 1 للموافقة أو 2 للرفض.",
      };
    }
    visit = pending[0] ?? null;
  }

  if (!visit) {
    return options.quotedMessageId
      ? { handled: true, reply: "لم أجد طلباً مرتبطاً بالرسالة المردود عليها." }
      : { handled: false };
  }
  if (visit.status !== "pending") {
    return { handled: true, reply: `تمت مراجعة هذا الطلب مسبقاً: ${visit.status === "approved" ? "مقبول" : "مرفوض"}.` };
  }

  const adminUser = await User.findOne({
    phone: { $in: phoneLookupValues(phone) },
    status: "active",
    role: { $in: ["owner", "super_admin", "admin"] },
  });
  const result = await decideVisitRequest({
    requestId: String(visit._id),
    decision,
    actor: {
      userId: adminUser ? String(adminUser._id) : undefined,
      phone,
      name: adminUser?.fullName || (await getConfiguredPhoneAdmin(phone))?.name || "مسؤول ثناره",
    },
  });

  if (result.outcome === "already_decided") {
    return { handled: true, reply: "تمت مراجعة هذا الطلب من قبل مسؤول آخر." };
  }
  if (result.outcome === "not_found") {
    return { handled: true, reply: "لم أتمكن من العثور على الطلب." };
  }
  if (decision === "approved") {
    return {
      handled: true,
      reply: result.invitationDeliveryStatus === "sent"
        ? "تمت الموافقة، وأُرسل رابط الدعوة ورمز التحقق إلى مقدم الطلب."
        : "تمت الموافقة، لكن تعذّر إرسال الدعوة. أعد المحاولة من لوحة الإدارة.",
    };
  }
  return {
    handled: true,
    reply: result.applicantNotificationStatus === "sent"
      ? "تم رفض الطلب وإبلاغ مقدم الطلب."
      : "تم رفض الطلب، لكن تعذّر إرسال إشعار لمقدم الطلب.",
  };
}
