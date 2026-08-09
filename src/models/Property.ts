import mongoose, { Schema, type Types } from "mongoose";

export interface IProperty {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  placeId: Types.ObjectId;
  name: string;
  category: string | null;
  totalRooms: number | null;
  capacity: number | null;
  rateB2B: string | null;
  rateB2C: string | null;
  photoLinks: string[];
  googleBusinessLink: string | null;
  facebookLink: string | null;
  website: string | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const propertySchema = new Schema<IProperty>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    placeId: { type: Schema.Types.ObjectId, ref: "Place", required: true },
    name: { type: String, required: true },
    category: { type: String, default: null },
    totalRooms: { type: Number, default: null },
    capacity: { type: Number, default: null },
    rateB2B: { type: String, default: null },
    rateB2C: { type: String, default: null },
    photoLinks: { type: [String], default: [] },
    googleBusinessLink: { type: String, default: null },
    facebookLink: { type: String, default: null },
    website: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

propertySchema.index({ companyId: 1 });
propertySchema.index({ placeId: 1 });

export const Property =
  (mongoose.models.Property as mongoose.Model<IProperty>) ||
  mongoose.model<IProperty>("Property", propertySchema);
