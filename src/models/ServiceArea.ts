import mongoose, { Schema, type Types } from "mongoose";

export interface IServiceArea {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  placeId: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const serviceAreaSchema = new Schema<IServiceArea>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    placeId: { type: Schema.Types.ObjectId, ref: "Place", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

serviceAreaSchema.index({ companyId: 1, placeId: 1 }, { unique: true });
serviceAreaSchema.index({ placeId: 1 });

export const ServiceArea =
  (mongoose.models.ServiceArea as mongoose.Model<IServiceArea>) ||
  mongoose.model<IServiceArea>("ServiceArea", serviceAreaSchema);
