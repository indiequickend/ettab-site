import * as z from "zod";

export const acceptInviteCreateAccountSchema = z
  .object({
    token: z.string().min(1),
    name: z.string().trim().min(2, "Name must be at least 2 characters long."),
    phone: z.string().trim().min(6, "Please enter a valid phone number."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .max(72, "Password must be at most 72 characters long."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type AcceptInviteCreateAccountInput = z.infer<typeof acceptInviteCreateAccountSchema>;

export const acceptInviteConfirmSchema = z.object({
  token: z.string().min(1),
  personName: z.string().trim().min(2, "Name must be at least 2 characters long."),
  personPhone: z.string().trim().min(6, "Please enter a valid phone number."),
});

export type AcceptInviteConfirmInput = z.infer<typeof acceptInviteConfirmSchema>;
