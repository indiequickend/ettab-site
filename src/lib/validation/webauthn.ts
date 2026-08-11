import * as z from "zod";

export const webauthnAuthOptionsSchema = z.object({
  email: z.email("Please enter a valid email.").trim(),
});

export const webauthnPreferenceSchema = z.object({
  dismissed: z.boolean(),
});
