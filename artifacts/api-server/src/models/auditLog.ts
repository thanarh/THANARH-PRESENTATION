import mongoose, { type Document, type Model } from "mongoose";

export interface IAuditLog extends Document {
  actor: string;
  actorId?: mongoose.Types.ObjectId;
  action: string;
  target?: string;
  targetId?: string;
  result: "success" | "failure" | "blocked";
  riskScore: "low" | "medium" | "high" | "critical";
  ipAddress: string;
  country?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  previousValue?: unknown;
  newValue?: unknown;
  timestamp: Date;
}

const auditLogSchema = new mongoose.Schema<IAuditLog>(
  {
    actor: { type: String, required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    target: String,
    targetId: String,
    result: { type: String, enum: ["success","failure","blocked"], default: "success" },
    riskScore: { type: String, enum: ["low","medium","high","critical"], default: "low" },
    ipAddress: { type: String, default: "" },
    country: String,
    userAgent: String,
    sessionId: String,
    metadata: { type: mongoose.Schema.Types.Mixed },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1 });

const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog ?? mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
export default AuditLog;

export async function logAudit(data: Omit<IAuditLog, "_id" | keyof Document>): Promise<void> {
  try {
    await AuditLog.create(data);
  } catch {
    // Audit logging must not break the main flow
  }
}
