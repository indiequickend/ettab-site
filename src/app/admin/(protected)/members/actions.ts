"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { authOptions } from "@/lib/auth-options";
import { removeOrphanedCompanies } from "@/lib/admin-cascade";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionPermissions, hasPermission } from "@/lib/permissions";
import { sendApprovalDecisionEmail, sendVerificationEmail } from "@/lib/resend";
import { generateVerificationToken } from "@/lib/tokens";
import { approveMemberSchema, rejectMemberSchema } from "@/lib/validation/admin";
import { CompanyPartner, Role, User } from "@/models";

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

async function requireMembersManagePermission() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: "Not authenticated." } as const;
  }
  const permissions = await getSessionPermissions(session.user.roles);
  if (!hasPermission(permissions, "members.manage")) {
    return { error: "You do not have permission to do this." } as const;
  }
  return { session } as const;
}

async function isLastSuperadmin(userId: string): Promise<boolean> {
  const superadminRole = await Role.findOne({ name: "superadmin" });
  if (!superadminRole) return false;
  const user = await User.findById(userId);
  if (!user || !user.roleIds.some((id) => id.equals(superadminRole._id))) {
    return false;
  }
  const superadminCount = await User.countDocuments({ roleIds: superadminRole._id });
  return superadminCount <= 1;
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

export async function resendVerificationEmailAction(
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
  if (user.status !== "pending_email") {
    return { formError: "This member has already verified their email." };
  }

  const { token: rawToken, tokenHash, expiresAt } = generateVerificationToken();
  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationTokenExpiresAt = expiresAt;
  await user.save();

  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/verify-email?token=${rawToken}`;
  try {
    await sendVerificationEmail(user.email, user.name, verifyUrl);
  } catch (err) {
    console.error(`Failed to resend verification email to ${user.email}`, err);
    return { formError: "Failed to send verification email. Please try again." };
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

export async function blockMemberAction(
  _prevState: MemberDecisionState,
  formData: FormData
): Promise<MemberDecisionState> {
  const auth = await requireMembersManagePermission();
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
  if (user._id.toString() === auth.session.user.id) {
    return { formError: "You cannot block your own account." };
  }
  if (user.status !== "approved") {
    return { formError: "Only approved members can be blocked." };
  }
  if (await isLastSuperadmin(user._id.toString())) {
    return { formError: "Cannot block the last superadmin." };
  }

  user.status = "suspended";
  await user.save();

  const partners = await CompanyPartner.find({ userId: user._id, status: "active" }).lean();
  await removeOrphanedCompanies(partners.map((partner) => partner.companyId));

  revalidatePath("/admin/members");
  revalidatePath("/admin/companies");
  revalidatePath("/admin/properties");
  revalidatePath("/admin/group-tours");
  return {};
}

export async function unblockMemberAction(
  _prevState: MemberDecisionState,
  formData: FormData
): Promise<MemberDecisionState> {
  const auth = await requireMembersManagePermission();
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
  if (user.status !== "suspended") {
    return { formError: "This member is not blocked." };
  }

  user.status = "approved";
  await user.save();

  revalidatePath("/admin/members");
  return {};
}

export async function removeMemberAction(
  _prevState: MemberDecisionState,
  formData: FormData
): Promise<MemberDecisionState> {
  const auth = await requireMembersManagePermission();
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
  if (user._id.toString() === auth.session.user.id) {
    return { formError: "You cannot remove your own account." };
  }
  if (await isLastSuperadmin(user._id.toString())) {
    return { formError: "Cannot remove the last superadmin." };
  }

  const partners = await CompanyPartner.find({ userId: user._id }).lean();
  const companyIds = partners.map((partner) => partner.companyId);

  await CompanyPartner.deleteMany({ userId: user._id });
  await user.deleteOne();
  await removeOrphanedCompanies(companyIds);

  revalidatePath("/admin/members");
  revalidatePath("/admin/companies");
  revalidatePath("/admin/properties");
  revalidatePath("/admin/group-tours");
  return {};
}
