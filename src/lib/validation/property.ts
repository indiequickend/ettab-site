import * as z from "zod";

import { placeSelectionShape, requiresAPlace } from "@/lib/validation/place";

const optionalUrl = z
  .union([z.url("Please enter a valid URL."), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

const propertyFieldsShape = {
  name: z.string().trim().min(2, "Property name must be at least 2 characters long."),
  category: z.string().trim().optional(),
  totalRooms: z.coerce.number().int().nonnegative().optional(),
  capacity: z.coerce.number().int().nonnegative().optional(),
  rateB2B: z.string().trim().optional(),
  rateB2C: z.string().trim().optional(),
  photoLinks: z.string().trim().optional(),
  googleBusinessLink: optionalUrl,
  facebookLink: optionalUrl,
  website: optionalUrl,
  ...placeSelectionShape,
};

export const propertySchema = z
  .object({ companyId: z.string().min(1), ...propertyFieldsShape })
  .refine(requiresAPlace, { error: "Please select or enter a location.", path: ["placeName"] });

export const updatePropertySchema = z
  .object({ propertyId: z.string().min(1), ...propertyFieldsShape })
  .refine(requiresAPlace, { error: "Please select or enter a location.", path: ["placeName"] });

export const deletePropertySchema = z.object({
  propertyId: z.string().min(1),
});
