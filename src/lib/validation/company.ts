import * as z from "zod";

import { memberTypeValues } from "@/lib/validation/auth";

export const companyDetailsSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().trim().min(2, "Company name must be at least 2 characters long."),
  memberTypes: z.array(z.enum(memberTypeValues)).min(1, "Select at least one member type."),
  licenceNumbers: z.string().trim().optional(),
});

export const partnerContactSchema = z.object({
  partnerId: z.string().min(1),
  personName: z.string().trim().min(2, "Name must be at least 2 characters long."),
  personPhone: z.string().trim().min(6, "Please enter a valid phone number."),
});

export const invitePartnerSchema = z.object({
  companyId: z.string().min(1),
  email: z.email("Please enter a valid email.").trim(),
});

export const revokeInviteSchema = z.object({
  inviteId: z.string().min(1),
});

export const removePartnerSchema = z.object({
  partnerId: z.string().min(1),
});

export const setActiveCompanySchema = z.object({
  companyId: z.string().min(1),
});
