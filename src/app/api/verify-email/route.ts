import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { getSettings } from "@/lib/settings";
import { hashToken } from "@/lib/tokens";
import { User } from "@/models";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    redirect("/verify-email?status=invalid");
  }

  await connectToDatabase();

  const tokenHash = hashToken(token);
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationTokenExpiresAt: { $gt: new Date() },
    status: "pending_email",
  });

  if (!user) {
    redirect("/verify-email?status=invalid");
  }

  const settings = await getSettings();

  user.emailVerified = new Date();
  user.emailVerificationTokenHash = null;
  user.emailVerificationTokenExpiresAt = null;
  user.status = settings.autoVerification ? "approved" : "pending_approval";
  await user.save();

  redirect("/verify-email?status=success");
}
