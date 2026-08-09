import * as z from "zod";

export const placeSelectionShape = {
  placeId: z.string().min(1).optional(),
  placeName: z.string().trim().min(2, "Place name must be at least 2 characters long.").optional(),
  placeIsState: z
    .string()
    .optional()
    .transform((value) => value === "true"),
};

export function requiresAPlace<T extends { placeId?: string; placeName?: string }>(data: T) {
  return Boolean(data.placeId || data.placeName);
}

export const placeSelectionSchema = z
  .object(placeSelectionShape)
  .refine(requiresAPlace, {
    error: "Please select or enter a place.",
    path: ["placeName"],
  });
