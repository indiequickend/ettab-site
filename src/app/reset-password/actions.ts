"use server";

import { redirect } from "next/navigation";

import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import { hashToken } from "@/lib/tokens";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { User } from "@/models";

export interface ResetPasswordState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await connectToDatabase();

  const tokenHash = hashToken(parsed.data.token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetTokenExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    return { formError: "This password reset link is invalid or has expired." };
  }

  user.passwordHash = await hashPassword(parsed.data.password);
  user.passwordResetTokenHash = null;
  user.passwordResetTokenExpiresAt = null;
  await user.save();

  redirect("/reset-password/success");
}
