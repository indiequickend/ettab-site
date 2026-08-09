import mongoose, { Schema, type Types } from "mongoose";

export type MemberType = "hotelier" | "tour_operator" | "car_vendor";

export interface ICompany {
  _id: Types.ObjectId;
  name: string;
  memberTypes: MemberType[];
  licenceNumbers: string[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true },
    memberTypes: {
      type: [String],
      enum: ["hotelier", "tour_operator", "car_vendor"],
      default: [],
    },
    licenceNumbers: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Company =
  (mongoose.models.Company as mongoose.Model<ICompany>) ||
  mongoose.model<ICompany>("Company", companySchema);
