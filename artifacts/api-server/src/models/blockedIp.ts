import mongoose, { type Document, type Model } from "mongoose";

export interface IBlockedIp extends Document {
  ipAddress: string;
  reason: string;
  blockedBy: mongoose.Types.ObjectId;
  expiresAt?: Date;
  createdAt: Date;
}

const blockedIpSchema = new mongoose.Schema<IBlockedIp>(
  {
    ipAddress: { type: String, required: true, unique: true },
    reason: { type: String, required: true },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const BlockedIp: Model<IBlockedIp> = mongoose.models.BlockedIp ?? mongoose.model<IBlockedIp>("BlockedIp", blockedIpSchema);
export default BlockedIp;
