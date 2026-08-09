import mongoose, { Schema, type Types } from "mongoose";

export interface IPlace {
  _id: Types.ObjectId;
  name: string;
  normalizedName: string;
  isState: boolean;
  stateName: string | null;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const placeSchema = new Schema<IPlace>(
  {
    name: { type: String, required: true },
    normalizedName: { type: String, required: true },
    isState: { type: Boolean, default: false },
    stateName: { type: String, default: null },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

placeSchema.index({ normalizedName: 1 }, { unique: true });

export const Place =
  (mongoose.models.Place as mongoose.Model<IPlace>) ||
  mongoose.model<IPlace>("Place", placeSchema);
