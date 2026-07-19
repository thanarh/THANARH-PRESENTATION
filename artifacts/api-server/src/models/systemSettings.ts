import mongoose, { type Document, type Model } from "mongoose";

export interface ISystemSettings extends Document {
  key: string;
  value: unknown;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const systemSettingsSchema = new mongoose.Schema<ISystemSettings>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const SystemSettings: Model<ISystemSettings> = mongoose.models.SystemSettings ?? mongoose.model<ISystemSettings>("SystemSettings", systemSettingsSchema);
export default SystemSettings;

export async function getSetting(key: string): Promise<unknown> {
  const doc = await SystemSettings.findOne({ key }).lean();
  return doc?.value;
}

export async function setSetting(key: string, value: unknown, updatedBy?: string): Promise<void> {
  await SystemSettings.findOneAndUpdate(
    { key },
    { value, ...(updatedBy ? { updatedBy: new mongoose.Types.ObjectId(updatedBy) } : {}) },
    { upsert: true, new: true },
  );
}
