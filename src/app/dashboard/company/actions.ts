"use server";

import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth-options";
import { ACTIVE_COMPANY_COOKIE, requireCompanyPartner } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { sendPartnerInviteEmail } from "@/lib/resend";
import { generateVerificationToken } from "@/lib/tokens";
import {
  companyDetailsSchema,
  invitePartnerSchema,
  partnerContactSchema,
  removePartnerSchema,
  revokeInviteSchema,
  setActiveCompanySchema,
} from "@/lib/validation/company";
import { Company, CompanyPartner, Invite, User } from "@/models";

export interface CompanyActionState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function requireSessionUserId(): Promise<{ userId: string; name: string } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated." };
  }
  return { userId: session.user.id, name: session.user.name ?? "An ETTAB member" };
}

export async function setActiveCompanyAction(companyId: string): Promise<void> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return;

  const parsed = setActiveCompanySchema.safeParse({ companyId });
  if (!parsed.success) return;

  await connectToDatabase();
  const partner = await CompanyPartner.findOne({
    companyId: parsed.data.companyId,
    userId: auth.userId,
    status: "active",
  });
  if (!partner) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE, parsed.data.companyId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard/company");
  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard/service-areas");
  revalidatePath("/dashboard/vehicles");
  revalidatePath("/dashboard/account");
}

export async function updateCompanyDetailsAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = companyDetailsSchema.safeParse({
    companyId: formData.get("companyId"),
    name: formData.get("name"),
    memberTypes: formData.getAll("memberTypes"),
    licenceNumbers: formData.get("licenceNumbers") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await connectToDatabase();
  try {
    await requireCompanyPartner(parsed.data.companyId, auth.userId);
  } catch {
    return { formError: "You are not a partner of this company." };
  }

  const licenceNumbers = parsed.data.licenceNumbers
    ? parsed.data.licenceNumbers
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  await Company.findByIdAndUpdate(parsed.data.companyId, {
    name: parsed.data.name,
    memberTypes: parsed.data.memberTypes,
    licenceNumbers,
  });

  // Member types gate the dashboard nav and several pages, not just this one.
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/company");
  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard/service-areas");
  revalidatePath("/dashboard/group-tours");
  revalidatePath("/dashboard/vehicles");
  return {};
}

export async function updatePartnerContactAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = partnerContactSchema.safeParse({
    partnerId: formData.get("partnerId"),
    personName: formData.get("personName"),
    personPhone: formData.get("personPhone"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await connectToDatabase();
  const partner = await CompanyPartner.findById(parsed.data.partnerId);
  if (!partner || partner.userId.toString() !== auth.userId) {
    return { formError: "This partner record could not be found." };
  }

  partner.personName = parsed.data.personName;
  partner.personPhone = parsed.data.personPhone;
  await partner.save();

  revalidatePath("/dashboard/company");
  return {};
}

export async function invitePartnerAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = invitePartnerSchema.safeParse({
    companyId: formData.get("companyId"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await connectToDatabase();
  try {
    await requireCompanyPartner(parsed.data.companyId, auth.userId);
  } catch {
    return { formError: "You are not a partner of this company." };
  }

  const email = parsed.data.email.toLowerCase();
  const company = await Company.findById(parsed.data.companyId);
  if (!company) {
    return { formError: "This company could not be found." };
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const existingPartner = await CompanyPartner.findOne({
      companyId: company._id,
      userId: existingUser._id,
      status: "active",
    });
    if (existingPartner) {
      return { fieldErrors: { email: ["This person is already a partner of this company."] } };
    }
  }

  const existingInvite = await Invite.findOne({
    companyId: company._id,
    email,
    status: "pending",
    expiresAt: { $gt: new Date() },
  });
  if (existingInvite) {
    return { fieldErrors: { email: ["An invite is already pending for this email."] } };
  }

  const { token, tokenHash, expiresAt } = generateVerificationToken(INVITE_TTL_MS);

  await Invite.create({
    companyId: company._id,
    email,
    tokenHash,
    expiresAt,
    invitedBy: auth.userId,
    status: "pending",
  });

  const acceptUrl = `${process.env.NEXTAUTH_URL}/invite/accept?token=${token}`;
  try {
    await sendPartnerInviteEmail(email, company.name, auth.name, acceptUrl);
  } catch (err) {
    console.error("Failed to send partner invite email", err);
    return { formError: "Invite created but the email failed to send - contact support." };
  }

  revalidatePath("/dashboard/company");
  return {};
}

export async function revokeInviteAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = revokeInviteSchema.safeParse({ inviteId: formData.get("inviteId") });
  if (!parsed.success) {
    return { formError: "Invalid request." };
  }

  await connectToDatabase();
  const invite = await Invite.findById(parsed.data.inviteId);
  if (!invite) {
    return { formError: "This invite could not be found." };
  }

  try {
    await requireCompanyPartner(invite.companyId.toString(), auth.userId);
  } catch {
    return { formError: "You are not a partner of this company." };
  }

  invite.status = "revoked";
  await invite.save();

  revalidatePath("/dashboard/company");
  return {};
}

export async function removePartnerAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = removePartnerSchema.safeParse({ partnerId: formData.get("partnerId") });
  if (!parsed.success) {
    return { formError: "Invalid request." };
  }

  await connectToDatabase();
  const target = await CompanyPartner.findById(parsed.data.partnerId);
  if (!target) {
    return { formError: "This partner could not be found." };
  }

  try {
    await requireCompanyPartner(target.companyId.toString(), auth.userId);
  } catch {
    return { formError: "You are not a partner of this company." };
  }

  if (target.userId.toString() === auth.userId) {
    return { formError: "You cannot remove yourself from the company." };
  }

  const activeCount = await CompanyPartner.countDocuments({
    companyId: target.companyId,
    status: "active",
  });
  if (activeCount <= 1) {
    return { formError: "A company must have at least one partner." };
  }

  await target.deleteOne();

  revalidatePath("/dashboard/company");
  return {};
}
