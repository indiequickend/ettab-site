"use server";

import mongoose, { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { getSessionPermissions, hasPermission } from "@/lib/permissions";
import { sendMemberCreatedEmail } from "@/lib/resend";
import { createMemberSchema } from "@/lib/validation/admin";
import { Company, CompanyPartner, Role, User } from "@/models";

export interface CreateMemberState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

async function requireMembersCreatePermission() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: "Not authenticated." } as const;
  }
  const permissions = await getSessionPermissions(session.user.roles);
  if (!hasPermission(permissions, "members.create")) {
    return { error: "You do not have permission to do this." } as const;
  }
  return { session } as const;
}

export async function createMemberAction(
  _prevState: CreateMemberState,
  formData: FormData
): Promise<CreateMemberState> {
  const auth = await requireMembersCreatePermission();
  if ("error" in auth) {
    return { formError: auth.error };
  }

  const parsed = createMemberSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    companyName: formData.get("companyName"),
    memberTypes: formData.getAll("memberTypes"),
    licenceNumbers: formData.get("licenceNumbers") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();

  await connectToDatabase();

  const existing = await User.findOne({ email });
  if (existing) {
    return { fieldErrors: { email: ["An account with this email already exists."] } };
  }

  const memberRole = await Role.findOne({ name: "member" });
  if (!memberRole) {
    return { formError: "Member role is not configured, please contact a superadmin." };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const licenceNumbers = data.licenceNumbers
    ? data.licenceNumbers
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const now = new Date();
  const actorId = auth.session.user.id ? new Types.ObjectId(auth.session.user.id) : null;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [
          {
            name: data.name,
            email,
            passwordHash,
            phone: data.phone,
            status: "approved",
            emailVerified: now,
            roleIds: [memberRole._id],
            approvedBy: actorId,
            approvedAt: now,
          },
        ],
        { session }
      );

      const [company] = await Company.create(
        [
          {
            name: data.companyName,
            memberTypes: data.memberTypes,
            licenceNumbers,
            createdBy: user._id,
          },
        ],
        { session }
      );

      await CompanyPartner.create(
        [
          {
            companyId: company._id,
            userId: user._id,
            personName: data.name,
            personPhone: data.phone,
            roleInCompany: "owner",
            status: "active",
          },
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  try {
    await sendMemberCreatedEmail(data.email, data.name, tempPassword);
  } catch (err) {
    console.error("Failed to send member-created email", err);
    return {
      formError: "Member created, but the welcome email failed to send - share their login manually.",
    };
  }

  redirect("/admin/members");
}
