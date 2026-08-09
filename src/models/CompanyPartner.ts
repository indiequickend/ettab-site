import mongoose, { Schema, type Types } from "mongoose";

export interface ICompanyPartner {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  userId: Types.ObjectId;
  personName: string;
  personPhone: string;
  roleInCompany: "owner" | "partner";
  status: "active" | "invited";
  createdAt: Date;
  updatedAt: Date;
}

const companyPartnerSchema = new Schema<ICompanyPartner>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    personName: { type: String, required: true },
    personPhone: { type: String, required: true },
    roleInCompany: { type: String, enum: ["owner", "partner"], default: "partner" },
    status: { type: String, enum: ["active", "invited"], default: "active" },
  },
  { timestamps: true }
);

companyPartnerSchema.index({ companyId: 1, userId: 1 }, { unique: true });

export const CompanyPartner =
  (mongoose.models.CompanyPartner as mongoose.Model<ICompanyPartner>) ||
  mongoose.model<ICompanyPartner>("CompanyPartner", companyPartnerSchema);
