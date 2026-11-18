import mongoose, { type Document, Schema } from "mongoose";
import crypto from "crypto";

export interface IWaOtp extends Document {
  phone: string;      // normalized digits only, e.g. "966501234567"
  otpHash: string;    // SHA-256 of the 6-digit code
  attempts: number;   // failed verification attempts (max 3 → invalidate)
  createdAt: Date;    // TTL index: auto-deleted after 5 min
}

const WaOtpSchema = new Schema<IWaOtp>(
  {
    phone:    { type: String, required: true, index: true },
    otpHash:  { type: String, required: true },
    attempts: { type: Number, default: 0 },
    createdAt:{ type: Date,   default: Date.now },
  },
  { timestamps: false }
);

// Auto-delete documents 5 minutes after creation
WaOtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

/** Generate a 6-digit numeric OTP and return both the plaintext and its hash */
export function generateWaOtp(): { code: string; hash: string } {
  const code = String(crypto.randomInt(100000, 1_000_000));
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  return { code, hash };
}

/** Verify a submitted code against a stored hash */
export function verifyWaOtp(submitted: string, storedHash: string): boolean {
  const h = crypto.createHash("sha256").update(submitted.trim()).digest("hex");
  const submittedDigest = Buffer.from(h, "hex");
  const expectedDigest = Buffer.from(storedHash, "hex");
  return submittedDigest.length === expectedDigest.length
    && crypto.timingSafeEqual(submittedDigest, expectedDigest);
}

/** Normalize an arbitrary phone string to digits-only international format */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

const WaOtp = mongoose.model<IWaOtp>("WaOtp", WaOtpSchema);
export default WaOtp;
