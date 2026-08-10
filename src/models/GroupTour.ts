import mongoose, { Schema, type Types } from "mongoose";

export interface IGroupTour {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  title: string;
  startDate: Date;
  endDate: Date;
  durationLabel: string;
  totalSeats: number;
  bookedSeats: number;
  rateB2B: string | null;
  rateB2C: string | null;
  description: string;
  isFull: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const groupTourSchema = new Schema<IGroupTour>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    title: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    durationLabel: { type: String, required: true },
    totalSeats: { type: Number, required: true },
    bookedSeats: { type: Number, required: true, default: 0 },
    rateB2B: { type: String, default: null },
    rateB2C: { type: String, default: null },
    description: { type: String, required: true },
    isFull: { type: Boolean, required: true, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

groupTourSchema.index({ companyId: 1, startDate: 1 });
groupTourSchema.index({ isFull: 1, startDate: 1 });

export const GroupTour =
  (mongoose.models.GroupTour as mongoose.Model<IGroupTour>) ||
  mongoose.model<IGroupTour>("GroupTour", groupTourSchema);
