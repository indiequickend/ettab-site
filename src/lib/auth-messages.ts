import type { UserStatus } from "@/models";

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
