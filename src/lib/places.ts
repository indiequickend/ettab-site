import { connectToDatabase } from "@/lib/mongodb";
import { Place, type IPlace } from "@/models";

export function normalizePlaceName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function findOrCreatePlace(name: string, isState = false): Promise<IPlace> {
  await connectToDatabase();
  const trimmed = name.trim();
  const normalizedName = normalizePlaceName(trimmed);

  const place = await Place.findOneAndUpdate(
    { normalizedName },
    {
      $setOnInsert: {
        name: trimmed,
        isState,
        stateName: isState ? trimmed : null,
      },
      $inc: { usageCount: 1 },
    },
    { upsert: true, new: true }
  );

  return place;
}

export async function resolvePlaceId(input: {
  placeId?: string;
  placeName?: string;
  placeIsState?: boolean;
}): Promise<string> {
  if (input.placeId) {
    await connectToDatabase();
    await Place.findByIdAndUpdate(input.placeId, { $inc: { usageCount: 1 } });
    return input.placeId;
  }

  const place = await findOrCreatePlace(input.placeName!, input.placeIsState ?? false);
  return place._id.toString();
}
