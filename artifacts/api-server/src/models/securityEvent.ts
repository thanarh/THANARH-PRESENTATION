import mongoose, { type Document, type Model } from "mongoose";

export type SecurityEventType =
  | "brute_force_attempt"
  | "invalid_token"
  | "unauthorized_route"
  | "session_anomaly"
  | "ip_blocked"
  | "multiple_sessions"
  | "rapid_section_access"
  | "suspicious_activity"
  | "screenshot_attempt"
  | "copy_attempt";

export interface ISecurityEvent extends Document {
  type: SecurityEventType;
  severity: "low" | "medium" | "high" | "critical";
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  ipAddress: string;
  country?: string;
  description: string;
  metadata?: Record<string, unknown>;
  resolved: boolean;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
}

const securityEventSchema = new mongoose.Schema<ISecurityEvent>(
  {
    type: { type: String, required: true },
    severity: { type: String, enum: ["low","medium","high","critical"], default: "medium" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sessionId: String,
    ipAddress: { type: String, required: true },
    country: String,
    description: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    resolved: { type: Boolean, default: false },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

securityEventSchema.index({ createdAt: -1 });
securityEventSchema.index({ severity: 1, resolved: 1 });

const SecurityEvent: Model<ISecurityEvent> = mongoose.models.SecurityEvent ?? mongoose.model<ISecurityEvent>("SecurityEvent", securityEventSchema);
export default SecurityEvent;
