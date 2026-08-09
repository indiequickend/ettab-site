import * as z from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Please enter your current password."),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .max(72, "Password must be at most 72 characters long."),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    error: "Passwords do not match.",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
