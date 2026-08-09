import * as z from "zod";

import { PERMISSIONS } from "@/lib/permission-constants";
import { memberTypeValues } from "@/lib/validation/auth";

export const createMemberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long."),
  email: z.email("Please enter a valid email.").trim(),
  phone: z.string().trim().min(6, "Please enter a valid phone number."),
  companyName: z.string().trim().min(2, "Company name must be at least 2 characters long."),
  memberTypes: z
    .array(z.enum(memberTypeValues))
    .min(1, "Select at least one member type."),
  licenceNumbers: z.string().trim().optional(),
});

export const rejectMemberSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().trim().max(1000, "Reason must be at most 1000 characters long.").optional(),
});

export const approveMemberSchema = z.object({
  userId: z.string().min(1),
});

export const roleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Role name must be at least 2 characters long.")
    .max(50, "Role name must be at most 50 characters long."),
  permissions: z.array(z.enum(PERMISSIONS)).default([]),
});

export const assignRolesSchema = z.object({
  userId: z.string().min(1),
  roleIds: z.array(z.string().min(1)).min(1, "Select at least one role."),
});
