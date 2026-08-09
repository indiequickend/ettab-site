import { connectToDatabase } from "@/lib/mongodb";
import { Settings, type ISettings } from "@/models";

export async function getSettings(): Promise<ISettings> {
  await connectToDatabase();
  const settings = await Settings.findOneAndUpdate(
    { key: "singleton" },
    { $setOnInsert: { key: "singleton", autoVerification: false } },
    { upsert: true, returnDocument: "after" }
  ).lean<ISettings>();
  return settings;
}

export async function updateSettings(
  patch: Partial<Pick<ISettings, "autoVerification">>
): Promise<ISettings> {
  await connectToDatabase();
  const settings = await Settings.findOneAndUpdate(
    { key: "singleton" },
    { $set: patch, $setOnInsert: { key: "singleton" } },
    { upsert: true, returnDocument: "after" }
  ).lean<ISettings>();
  return settings;
}
