import mongoose, { Schema, type Types } from "mongoose";

export type UserStatus =
  | "pending_email"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "suspended";

export interface IWebAuthnCredential {
  credentialId: string;
  publicKey: Buffer;
  counter: number;
  transports: string[];
  createdAt: Date;
}

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
  approvedBy: Types.ObjectId | null;
  approvedAt: Date | null;
  rejectedBy: Types.ObjectId | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  webauthnCredentials: IWebAuthnCredential[];
  webauthnChallenge: string | null;
  webauthnChallengeExpiresAt: Date | null;
  fingerprintPromptDismissed: boolean;
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
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    webauthnCredentials: {
      type: [
        {
          credentialId: { type: String, required: true },
          publicKey: { type: Buffer, required: true },
          counter: { type: Number, default: 0 },
          transports: { type: [String], default: [] },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    webauthnChallenge: { type: String, default: null },
    webauthnChallengeExpiresAt: { type: Date, default: null },
    fingerprintPromptDismissed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ "webauthnCredentials.credentialId": 1 });

export const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);
