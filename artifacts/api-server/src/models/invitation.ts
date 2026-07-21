import mongoose, { type Document, type Model } from "mongoose";

export type InvitationStatus =
  | "draft" | "scheduled" | "sent" | "opened"
  | "registration_started" | "active" | "expired"
  | "revoked" | "blocked" | "used" | "failed_delivery";

export interface IInvitation extends Document {
  inviteeName: string;
  email: string;
  tokenHash: string;
  inviteCode: string;
  role: string;
  permissions: string[];
  allowedSections: string[];
  startsAt?: Date;
  expiresAt: Date;
  maxLogins: number;
  maxDevices: number;
  sessionDurationMinutes: number;
  usedCount: number;
  status: InvitationStatus;
  allowComments: boolean;
  allowFullScreen: boolean;
  allowViewFinancials: boolean;
  phone?: string;
  customMessage?: string;
  reason?: string;
  internalRef?: string;
  createdBy: mongoose.Types.ObjectId;
  revokedBy?: mongoose.Types.ObjectId;
  revokeReason?: string;
  extendHistory: Array<{
    previousExpiry: Date;
    newExpiry: Date;
    reason: string;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new mongoose.Schema<IInvitation>(
  {
    inviteeName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    tokenHash: { type: String, required: true, unique: true },
    inviteCode: { type: String, unique: true, sparse: true },
    role: { type: String, required: true },
    permissions: [{ type: String }],
    allowedSections: [{ type: String }],
    startsAt: Date,
    expiresAt: { type: Date, required: true },
    maxLogins: { type: Number, default: 5 },
    maxDevices: { type: Number, default: 2 },
    sessionDurationMinutes: { type: Number, default: 60 },
    usedCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft","scheduled","sent","opened","registration_started","active","expired","revoked","blocked","used","failed_delivery"],
      default: "draft",
    },
    allowComments: { type: Boolean, default: false },
    allowFullScreen: { type: Boolean, default: true },
    allowViewFinancials: { type: Boolean, default: false },
    phone: { type: String, trim: true },
    customMessage: String,
    reason: String,
    internalRef: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    revokeReason: String,
    extendHistory: [
      {
        previousExpiry: Date,
        newExpiry: Date,
        reason: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ expiresAt: 1 });

const Invitation: Model<IInvitation> = mongoose.models.Invitation ?? mongoose.model<IInvitation>("Invitation", invitationSchema);
export default Invitation;
