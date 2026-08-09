"use server";

import mongoose from "mongoose";
import { redirect } from "next/navigation";

import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/resend";
import { generateVerificationToken } from "@/lib/tokens";
import { registerSchema } from "@/lib/validation/auth";
import { Company, CompanyPartner, Role, User } from "@/models";

export interface RegisterState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const memberTypes = formData.getAll("memberTypes");

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    phone: formData.get("phone"),
    companyName: formData.get("companyName"),
    memberTypes,
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
    return {
      formError: "Registration is temporarily unavailable, please contact ETTAB admin.",
    };
  }

  const passwordHash = await hashPassword(data.password);
  const { token: rawToken, tokenHash, expiresAt } = generateVerificationToken();

  const licenceNumbers = data.licenceNumbers
    ? data.licenceNumbers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

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
            status: "pending_email",
            roleIds: [memberRole._id],
            emailVerificationTokenHash: tokenHash,
            emailVerificationTokenExpiresAt: expiresAt,
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

  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/verify-email?token=${rawToken}`;
  try {
    await sendVerificationEmail(data.email, data.name, verifyUrl);
  } catch (err) {
    console.error("Failed to send verification email", err);
    return {
      formError:
        "Account created but the verification email failed to send - contact support.",
    };
  }

  redirect("/register/success");
}
