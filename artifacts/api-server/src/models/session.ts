import mongoose, { type Document, type Model } from "mongoose";

export type SessionStatus = "active" | "expired" | "revoked" | "idle_timeout";
export type RiskScore = "low" | "medium" | "high" | "critical";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  invitationId?: mongoose.Types.ObjectId;
  sessionTokenHash: string;
  refreshTokenHash: string;
  sessionCode: string;
  ipAddress: string;
  country?: string;
  userAgent: string;
  deviceType: string;
  deviceFingerprint?: string;
  startedAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  revokedBy?: mongoose.Types.ObjectId;
  riskScore: RiskScore;
  status: SessionStatus;
  visitedSections: string[];
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new mongoose.Schema<ISession>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    invitationId: { type: mongoose.Schema.Types.ObjectId, ref: "Invitation" },
    sessionTokenHash: { type: String, required: true, unique: true },
    refreshTokenHash: { type: String, required: true },
    sessionCode: { type: String, required: true },
    ipAddress: { type: String, required: true },
    country: String,
    userAgent: { type: String, default: "" },
    deviceType: { type: String, default: "web" },
    deviceFingerprint: String,
    startedAt: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    riskScore: { type: String, enum: ["low","medium","high","critical"], default: "low" },
    status: { type: String, enum: ["active","expired","revoked","idle_timeout"], default: "active" },
    visitedSections: [{ type: String }],
  },
  { timestamps: true },
);

sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ sessionTokenHash: 1 });
sessionSchema.index({ expiresAt: 1 });

const Session: Model<ISession> = mongoose.models.Session ?? mongoose.model<ISession>("Session", sessionSchema);
export default Session;
