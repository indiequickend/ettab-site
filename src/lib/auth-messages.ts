import type { UserStatus } from "@/models";

export const RATE_LIMIT_ERROR_CODE = "RATE_LIMITED";

export function rateLimitMessage(retryAfter: string): string {
  return `Too many attempts. Please try again in ${retryAfter}.`;
}

export function statusRejectionMessage(status: UserStatus): string {
  switch (status) {
    case "pending_email":
      return "Please verify your email before logging in.";
    case "pending_approval":
      return "Your account is awaiting admin approval.";
    case "rejected":
      return "Your registration was not approved. Contact ETTAB admin.";
    case "suspended":
      return "Your account has been suspended. Contact ETTAB admin.";
    case "approved":
      return "";
  }
}
