import mongoose, { Schema, type Types } from "mongoose";

export interface IRateLimitAttempt {
  _id: Types.ObjectId;
  key: string;
  count: number;
  expiresAt: Date;
}

const rateLimitAttemptSchema = new Schema<IRateLimitAttempt>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 1 },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const RateLimitAttempt =
  (mongoose.models.RateLimitAttempt as mongoose.Model<IRateLimitAttempt>) ||
  mongoose.model<IRateLimitAttempt>("RateLimitAttempt", rateLimitAttemptSchema);
