import * as z from "zod";

export const memberTypeValues = ["hotelier", "tour_operator", "car_vendor"] as const;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters long."),
    email: z.email("Please enter a valid email.").trim(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .max(72, "Password must be at most 72 characters long."),
    confirmPassword: z.string(),
    phone: z.string().trim().min(6, "Please enter a valid phone number."),
    companyName: z.string().trim().min(2, "Company name must be at least 2 characters long."),
    memberTypes: z
      .array(z.enum(memberTypeValues))
      .min(1, "Select at least one member type."),
    licenceNumbers: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("Please enter a valid email.").trim(),
  password: z.string().min(1, "Please enter your password."),
});

export type LoginInput = z.infer<typeof loginSchema>;
