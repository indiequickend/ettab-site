import mongoose, { Schema, type Types } from "mongoose";

export interface IWebauthnChallenge {
  _id: Types.ObjectId;
  challenge: string;
  expiresAt: Date;
}

const webauthnChallengeSchema = new Schema<IWebauthnChallenge>({
  challenge: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const WebauthnChallenge =
  (mongoose.models.WebauthnChallenge as mongoose.Model<IWebauthnChallenge>) ||
  mongoose.model<IWebauthnChallenge>("WebauthnChallenge", webauthnChallengeSchema);
