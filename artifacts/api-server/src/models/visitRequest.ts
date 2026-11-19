import mongoose, { type Document, type Model } from "mongoose";

export type VisitRequestStatus = "pending" | "approved" | "rejected" | "completed";

export interface IVisitRequest extends Document {
  fullName: string;
  phone: string;
  email?: string;
  reason: string;
  visitorType: string;
  status: VisitRequestStatus;
  scheduledAt?: Date;
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedByName?: string;
  reviewedByPhone?: string;
  reviewedAt?: Date;
  invitationId?: mongoose.Types.ObjectId;
  invitationDeliveryStatus?: "pending" | "sent" | "failed";
  applicantNotificationStatus?: "pending" | "sent" | "failed" | "skipped";
  notificationDeliveryStatus?: "pending" | "sent" | "partial" | "failed";
  approvalMessages: Array<{
    adminPhone: string;
    messageId: string;
    sentAt: Date;
  }>;
  requestedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const approvalMessageSchema = new mongoose.Schema(
  {
    adminPhone: { type: String, required: true },
    messageId: { type: String, required: true },
    sentAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const visitRequestSchema = new mongoose.Schema<IVisitRequest>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    reason: { type: String, required: true },
    visitorType: { type: String, required: true },
    status: { type: String, enum: ["pending","approved","rejected","completed"], default: "pending" },
    scheduledAt: Date,
    rejectionReason: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedByName: String,
    reviewedByPhone: String,
    reviewedAt: Date,
    invitationId: { type: mongoose.Schema.Types.ObjectId, ref: "Invitation" },
    invitationDeliveryStatus: { type: String, enum: ["pending", "sent", "failed"] },
    applicantNotificationStatus: { type: String, enum: ["pending", "sent", "failed", "skipped"] },
    notificationDeliveryStatus: { type: String, enum: ["pending", "sent", "partial", "failed"] },
    approvalMessages: { type: [approvalMessageSchema], default: [] },
    requestedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

visitRequestSchema.index({ createdAt: -1 });
visitRequestSchema.index({ status: 1 });

const VisitRequest: Model<IVisitRequest> = mongoose.models.VisitRequest ?? mongoose.model<IVisitRequest>("VisitRequest", visitRequestSchema);
export default VisitRequest;
