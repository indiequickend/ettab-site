import * as z from "zod";

import { PERMISSIONS } from "@/lib/permission-constants";

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
