"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionPermissions, hasPermission } from "@/lib/permissions";
import { sendApprovalDecisionEmail } from "@/lib/resend";
import { approveMemberSchema, rejectMemberSchema } from "@/lib/validation/admin";
import { User } from "@/models";

export interface MemberDecisionState {
  formError?: string;
}

async function requireMembersApprovePermission() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: "Not authenticated." } as const;
  }
  const permissions = await getSessionPermissions(session.user.roles);
  if (!hasPermission(permissions, "members.approve")) {
    return { error: "You do not have permission to do this." } as const;
  }
  return { session } as const;
}

export async function approveMemberAction(
  _prevState: MemberDecisionState,
  formData: FormData
): Promise<MemberDecisionState> {
  const auth = await requireMembersApprovePermission();
  if ("error" in auth) {
    return { formError: auth.error };
  }

  const parsed = approveMemberSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) {
    return { formError: "Invalid request." };
  }

  await connectToDatabase();
  const user = await User.findById(parsed.data.userId);
  if (!user) {
    return { formError: "This member could not be found." };
  }
  if (user.status !== "pending_approval") {
    return { formError: "This registration has already been decided." };
  }

  user.status = "approved";
  user.approvedBy = auth.session.user.id ? new Types.ObjectId(auth.session.user.id) : null;
  user.approvedAt = new Date();
  user.rejectedBy = null;
  user.rejectedAt = null;
  user.rejectionReason = null;
  await user.save();

  try {
    await sendApprovalDecisionEmail(user.email, user.name, { status: "approved" });
  } catch (err) {
    console.error(`Failed to send approval email to ${user.email}`, err);
  }

  revalidatePath("/admin/members");
  return {};
}

export async function rejectMemberAction(
  _prevState: MemberDecisionState,
  formData: FormData
): Promise<MemberDecisionState> {
  const auth = await requireMembersApprovePermission();
  if ("error" in auth) {
    return { formError: auth.error };
  }

  const parsed = rejectMemberSchema.safeParse({
    userId: formData.get("userId"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) {
    return { formError: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  await connectToDatabase();
  const user = await User.findById(parsed.data.userId);
  if (!user) {
    return { formError: "This member could not be found." };
  }
  if (user.status !== "pending_approval") {
    return { formError: "This registration has already been decided." };
  }

  user.status = "rejected";
  user.rejectedBy = auth.session.user.id ? new Types.ObjectId(auth.session.user.id) : null;
  user.rejectedAt = new Date();
  user.rejectionReason = parsed.data.reason || null;
  user.approvedBy = null;
  user.approvedAt = null;
  await user.save();

  try {
    await sendApprovalDecisionEmail(user.email, user.name, {
      status: "rejected",
      reason: parsed.data.reason || null,
    });
  } catch (err) {
    console.error(`Failed to send rejection email to ${user.email}`, err);
  }

  revalidatePath("/admin/members");
  return {};
}
