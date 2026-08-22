import mongoose, { Schema, type Types } from "mongoose";

export interface IVehicle {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  placeId: Types.ObjectId;
  name: string;
  vehicleType: string | null;
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

const vehicleSchema = new Schema<IVehicle>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    placeId: { type: Schema.Types.ObjectId, ref: "Place", required: true },
    name: { type: String, required: true },
    vehicleType: { type: String, default: null },
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

vehicleSchema.index({ companyId: 1 });
vehicleSchema.index({ placeId: 1 });

export const Vehicle =
  (mongoose.models.Vehicle as mongoose.Model<IVehicle>) ||
  mongoose.model<IVehicle>("Vehicle", vehicleSchema);
