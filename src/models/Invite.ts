import mongoose, { Schema, type Types } from "mongoose";

export type InviteStatus = "pending" | "accepted" | "revoked";

export interface IInvite {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  invitedBy: Types.ObjectId;
  status: InviteStatus;
  createdAt: Date;
  updatedAt: Date;
}

const inviteSchema = new Schema<IInvite>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "revoked"], default: "pending" },
  },
  { timestamps: true }
);

export const Invite =
  (mongoose.models.Invite as mongoose.Model<IInvite>) ||
  mongoose.model<IInvite>("Invite", inviteSchema);
