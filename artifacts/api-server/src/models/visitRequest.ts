import mongoose, { type Document, type Model } from "mongoose";

export type VisitRequestStatus = "pending" | "approved" | "rejected" | "completed";

export interface IVisitRequest extends Document {
  fullName: string;
  phone: string;
  email: string;
  reason: string;
  visitorType: string;
  status: VisitRequestStatus;
  scheduledAt?: Date;
  rejectionReason?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  requestedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const visitRequestSchema = new mongoose.Schema<IVisitRequest>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    reason: { type: String, required: true },
    visitorType: { type: String, required: true },
    status: { type: String, enum: ["pending","approved","rejected","completed"], default: "pending" },
    scheduledAt: Date,
    rejectionReason: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    requestedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

visitRequestSchema.index({ createdAt: -1 });
visitRequestSchema.index({ status: 1 });

const VisitRequest: Model<IVisitRequest> = mongoose.models.VisitRequest ?? mongoose.model<IVisitRequest>("VisitRequest", visitRequestSchema);
export default VisitRequest;
