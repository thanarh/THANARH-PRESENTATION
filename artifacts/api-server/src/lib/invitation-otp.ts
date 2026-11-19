import { Types } from "mongoose";
import WaOtp, { generateWaOtp, normalizePhone } from "../models/waOtp";

type InvitationRef = string | Types.ObjectId;

export async function createInvitationOtp(phone: string, invitationId: InvitationRef): Promise<string> {
  const normalizedPhone = normalizePhone(phone);
  await WaOtp.deleteMany({ phone: normalizedPhone, purpose: "invitation", invitationId });
  const { code, hash } = generateWaOtp();
  await WaOtp.create({
    phone: normalizedPhone,
    otpHash: hash,
    purpose: "invitation",
    invitationId,
  });
  return code;
}

export async function clearInvitationOtp(phone: string, invitationId: InvitationRef): Promise<void> {
  await WaOtp.deleteMany({
    phone: normalizePhone(phone),
    purpose: "invitation",
    invitationId,
  });
}

export async function getInvitationOtpState(
  phone: string,
  invitationId: InvitationRef,
): Promise<{ available: boolean; resendIn: number }> {
  const otp = await WaOtp.findOne({
    phone: normalizePhone(phone),
    purpose: "invitation",
    invitationId,
  }).sort({ createdAt: -1 }).lean();

  if (!otp) return { available: false, resendIn: 0 };

  const ageMs = Date.now() - new Date(otp.createdAt).getTime();
  return {
    available: ageMs >= 0 && ageMs < 300_000 && otp.attempts < 3,
    resendIn: Math.max(0, Math.ceil((60_000 - ageMs) / 1000)),
  };
}
