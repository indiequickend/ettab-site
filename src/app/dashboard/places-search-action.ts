"use server";

import { connectToDatabase } from "@/lib/mongodb";
import { normalizePlaceName } from "@/lib/places";
import { Place } from "@/models";

export interface PlaceOption {
  id: string;
  name: string;
  isState: boolean;
}

export async function searchPlacesAction(query: string): Promise<PlaceOption[]> {
  const normalized = normalizePlaceName(query);
  if (!normalized) {
    return [];
  }

  await connectToDatabase();
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const places = await Place.find({ normalizedName: { $regex: escaped } })
    .sort({ usageCount: -1 })
    .limit(10)
    .lean();

  return places.map((place) => ({
    id: place._id.toString(),
    name: place.name,
    isState: place.isState,
  }));
}
