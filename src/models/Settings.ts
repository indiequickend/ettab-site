import mongoose, { Schema } from "mongoose";

export interface ISettings {
  key: "singleton";
  autoVerification: boolean;
}

const settingsSchema = new Schema<ISettings>({
  key: { type: String, required: true, unique: true, default: "singleton" },
  autoVerification: { type: Boolean, default: false },
});

export const Settings =
  (mongoose.models.Settings as mongoose.Model<ISettings>) ||
  mongoose.model<ISettings>("Settings", settingsSchema);
