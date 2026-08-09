import * as z from "zod";

import { placeSelectionShape, requiresAPlace } from "@/lib/validation/place";

export const addServiceAreaSchema = z
  .object({ companyId: z.string().min(1), ...placeSelectionShape })
  .refine(requiresAPlace, { error: "Please select or enter a location.", path: ["placeName"] });

export const removeServiceAreaSchema = z.object({
  serviceAreaId: z.string().min(1),
});
