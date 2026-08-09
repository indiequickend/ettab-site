"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword, verifyPassword } from "@/lib/password";
import { changePasswordSchema } from "@/lib/validation/account";
import { User } from "@/models";

export interface ChangePasswordState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  success?: boolean;
}

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { formError: "You must be logged in to do this." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmNewPassword: formData.get("confirmNewPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await connectToDatabase();
  const user = await User.findById(session.user.id);
  if (!user) {
    return { formError: "Your account could not be found." };
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { fieldErrors: { currentPassword: ["Current password is incorrect."] } };
  }

  user.passwordHash = await hashPassword(parsed.data.newPassword);
  await user.save();

  return { success: true };
}
