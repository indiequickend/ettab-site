import * as z from "zod";

import { placeSelectionShape, requiresAPlace } from "@/lib/validation/place";

const optionalUrl = z
  .union([z.url("Please enter a valid URL."), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

const vehicleFieldsShape = {
  name: z.string().trim().min(2, "Vehicle name must be at least 2 characters long."),
  vehicleType: z.string().trim().optional(),
  capacity: z.coerce.number().int().nonnegative().optional(),
  rateB2B: z.string().trim().optional(),
  rateB2C: z.string().trim().optional(),
  photoLinks: z.string().trim().optional(),
  googleBusinessLink: optionalUrl,
  facebookLink: optionalUrl,
  website: optionalUrl,
  ...placeSelectionShape,
};

export const vehicleSchema = z
  .object({ companyId: z.string().min(1), ...vehicleFieldsShape })
  .refine(requiresAPlace, { error: "Please select or enter a location.", path: ["placeName"] });

export const updateVehicleSchema = z
  .object({ vehicleId: z.string().min(1), ...vehicleFieldsShape })
  .refine(requiresAPlace, { error: "Please select or enter a location.", path: ["placeName"] });

export const deleteVehicleSchema = z.object({
  vehicleId: z.string().min(1),
});
