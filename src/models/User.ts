import mongoose, { Schema, type Types } from "mongoose";

export type UserStatus =
  | "pending_email"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "suspended";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  emailVerified: Date | null;
  status: UserStatus;
  roleIds: Types.ObjectId[];
  emailVerificationTokenHash: string | null;
  emailVerificationTokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: "" },
    emailVerified: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending_email", "pending_approval", "approved", "rejected", "suspended"],
      default: "pending_email",
    },
    roleIds: { type: [Schema.Types.ObjectId], ref: "Role", default: [] },
    emailVerificationTokenHash: { type: String, default: null },
    emailVerificationTokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);
