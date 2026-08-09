import mongoose, { Schema, type Types } from "mongoose";

export interface IRole {
  _id: Types.ObjectId;
  name: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Role =
  (mongoose.models.Role as mongoose.Model<IRole>) ||
  mongoose.model<IRole>("Role", roleSchema);
