"use server";

import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import { hashToken } from "@/lib/tokens";
import {
  acceptInviteConfirmSchema,
  acceptInviteCreateAccountSchema,
} from "@/lib/validation/invite";
import { CompanyPartner, Invite, Role, User } from "@/models";

export interface InviteActionState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

async function findPendingInvite(token: string) {
  const tokenHash = hashToken(token);
  return Invite.findOne({
    tokenHash,
    status: "pending",
    expiresAt: { $gt: new Date() },
  });
}

export async function confirmJoinAction(
  _prevState: InviteActionState,
  formData: FormData
): Promise<InviteActionState> {
  const parsed = acceptInviteConfirmSchema.safeParse({
    token: formData.get("token"),
    personName: formData.get("personName"),
    personPhone: formData.get("personPhone"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return { formError: "You must be logged in to accept this invite." };
  }

  await connectToDatabase();
  const invite = await findPendingInvite(parsed.data.token);
  if (!invite) {
    return { formError: "This invite link is invalid or has expired." };
  }
  if (invite.email !== session.user.email.toLowerCase()) {
    return { formError: "This invite was sent to a different email address." };
  }

  await CompanyPartner.findOneAndUpdate(
    { companyId: invite.companyId, userId: session.user.id },
    {
      $set: {
        personName: parsed.data.personName,
        personPhone: parsed.data.personPhone,
        status: "active",
      },
      $setOnInsert: { roleInCompany: "partner" },
    },
    { upsert: true }
  );

  invite.status = "accepted";
  await invite.save();

  revalidatePath("/dashboard/company");
  redirect("/dashboard/company");
}

export async function createAccountAndJoinAction(
  _prevState: InviteActionState,
  formData: FormData
): Promise<InviteActionState> {
  const parsed = acceptInviteCreateAccountSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await connectToDatabase();
  const invite = await findPendingInvite(parsed.data.token);
  if (!invite) {
    return { formError: "This invite link is invalid or has expired." };
  }

  const existingUser = await User.findOne({ email: invite.email });
  if (existingUser) {
    return {
      formError:
        "An account already exists for this email. Please log in, then reopen this invite link.",
    };
  }

  const memberRole = await Role.findOne({ name: "member" });
  if (!memberRole) {
    return { formError: "Registration is temporarily unavailable, please contact ETTAB admin." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [
          {
            name: parsed.data.name,
            email: invite.email,
            passwordHash,
            phone: parsed.data.phone,
            status: "approved",
            emailVerified: new Date(),
            roleIds: [memberRole._id],
          },
        ],
        { session }
      );

      await CompanyPartner.create(
        [
          {
            companyId: invite.companyId,
            userId: user._id,
            personName: parsed.data.name,
            personPhone: parsed.data.phone,
            roleInCompany: "partner",
            status: "active",
          },
        ],
        { session }
      );

      invite.status = "accepted";
      await invite.save({ session });
    });
  } finally {
    await session.endSession();
  }

  redirect("/invite/accept/success");
}
