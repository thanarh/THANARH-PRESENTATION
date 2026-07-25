import mongoose, { type Document, type Model } from "mongoose";

export type SectionStatus = "draft" | "published" | "archived";

export interface IPresentationSection extends Document {
  slug: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  content: Record<string, unknown>;
  order: number;
  status: SectionStatus;
  requiredPermission?: string;
  audience: string[];
  updatedBy?: mongoose.Types.ObjectId;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const presentationSectionSchema = new mongoose.Schema<IPresentationSection>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    titleAr: { type: String, required: true },
    titleEn: { type: String, required: true },
    descriptionAr: String,
    descriptionEn: String,
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ["draft","published","archived"], default: "draft" },
    requiredPermission: String,
    audience: [{ type: String }],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    publishedAt: Date,
  },
  { timestamps: true },
);

const PresentationSection: Model<IPresentationSection> = mongoose.models.PresentationSection ?? mongoose.model<IPresentationSection>("PresentationSection", presentationSectionSchema);
export default PresentationSection;
