import * as z from "zod";

export const webauthnPreferenceSchema = z.object({
  dismissed: z.boolean(),
});
