import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { getUsersWithPermission } from "@/lib/permissions";
import { sendAdminNewRegistrationEmail } from "@/lib/resend";
import { getSettings } from "@/lib/settings";
import { hashToken } from "@/lib/tokens";
import { CompanyPartner, User } from "@/models";

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

  if (user.status === "pending_approval") {
    try {
      const recipients = await getUsersWithPermission("members.approve");
      if (recipients.length > 0) {
        const partner = await CompanyPartner.findOne({ userId: user._id }).populate<{
          companyId: { name: string };
        }>("companyId");
        await sendAdminNewRegistrationEmail(recipients, {
          name: user.name,
          email: user.email,
          companyName: partner?.companyId?.name ?? "—",
        });
      }
    } catch (err) {
      console.error("Failed to send admin notification email", err);
    }
  }

  const successStatus = user.status === "approved" ? "approved" : "success";
  redirect(`/verify-email?status=${successStatus}`);
}
