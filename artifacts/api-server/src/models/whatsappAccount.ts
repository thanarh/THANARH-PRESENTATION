import mongoose, { type Document, type Model } from "mongoose";

export interface IWhatsAppAdminUser {
  _id?: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  enabled: boolean;
  permissions: string[];
  topics: string[];
}

export interface IWhatsAppAccount extends Document {
  name: string;
  phone?: string;
  enabled: boolean;
  autoReplyEnabled: boolean;
  responseTopics: string[];
  responseInstructions?: string;
  adminUsers: IWhatsAppAdminUser[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const adminUserSchema = new mongoose.Schema<IWhatsAppAdminUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true },
    permissions: [{ type: String }],
    topics: [{ type: String }],
  },
  { _id: true },
);

const whatsappAccountSchema = new mongoose.Schema<IWhatsAppAccount>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    enabled: { type: Boolean, default: true },
    autoReplyEnabled: { type: Boolean, default: true },
    responseTopics: [{ type: String, trim: true }],
    responseInstructions: { type: String, trim: true },
    adminUsers: { type: [adminUserSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

whatsappAccountSchema.index({ phone: 1 });
whatsappAccountSchema.index({ enabled: 1 });

const WhatsAppAccount: Model<IWhatsAppAccount> =
  mongoose.models.WhatsAppAccount ??
  mongoose.model<IWhatsAppAccount>("WhatsAppAccount", whatsappAccountSchema);

export default WhatsAppAccount;

export function normalizeWhatsAppPhone(value: string): string {
  return value.trim().replace(/[^\d]/g, "");
}

export function phoneFromJid(jid: string): string {
  return normalizeWhatsAppPhone(jid.split("@")[0].split(":")[0]);
}

export function serializeWhatsAppAccount(account: IWhatsAppAccount) {
  return {
    id: account._id.toString(),
    name: account.name,
    phone: account.phone ?? "",
    enabled: account.enabled,
    autoReplyEnabled: account.autoReplyEnabled,
    responseTopics: account.responseTopics ?? [],
    responseInstructions: account.responseInstructions ?? "",
    adminUsers: (account.adminUsers ?? []).map((admin) => ({
      id: admin._id?.toString(),
      name: admin.name,
      phone: admin.phone,
      enabled: admin.enabled,
      permissions: admin.permissions ?? ["commands"],
      topics: admin.topics ?? [],
    })),
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}