import mongoose, { type Document, type Model } from "mongoose";

export type UserRole = "owner" | "super_admin" | "admin" | "presenter" | "investor" | "partner" | "team_member" | "viewer";
export type UserStatus = "active" | "disabled" | "pending";

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  allowedSections: string[];
  preferredLanguage: string;
  profileImage?: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  emailVerified: boolean;
  emailVerificationCode?: string;
  emailVerificationExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  invitationId?: mongoose.Types.ObjectId;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "super_admin", "admin", "presenter", "investor", "partner", "team_member", "viewer"],
      default: "viewer",
    },
    status: { type: String, enum: ["active", "disabled", "pending"], default: "pending" },
    permissions: [{ type: String }],
    allowedSections: [{ type: String }],
    preferredLanguage: { type: String, default: "ar" },
    profileImage: String,
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: String,
    emailVerified: { type: Boolean, default: false },
    emailVerificationCode: String,
    emailVerificationExpiry: Date,
    passwordResetToken: String,
    passwordResetExpiry: Date,
    invitationId: { type: mongoose.Schema.Types.ObjectId, ref: "Invitation" },
    lastLoginAt: Date,
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
  },
  { timestamps: true },
);

// email already indexed via unique:true in the schema definition — no duplicate needed

const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
export default User;
