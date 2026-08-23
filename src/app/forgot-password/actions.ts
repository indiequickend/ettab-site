"use server";

import { connectToDatabase } from "@/lib/mongodb";
import { checkRateLimit, formatRetryAfter, getClientIp } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/resend";
import { generateVerificationToken } from "@/lib/tokens";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { User } from "@/models";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const FORGOT_PASSWORD_RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };

export interface ForgotPasswordState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  success?: boolean;
}

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const email = parsed.data.email.toLowerCase();

  const ip = await getClientIp();
  const [ipLimit, emailLimit] = await Promise.all([
    checkRateLimit(`forgot-password:${ip}`, FORGOT_PASSWORD_RATE_LIMIT),
    checkRateLimit(`forgot-password:${email}`, FORGOT_PASSWORD_RATE_LIMIT),
  ]);
  if (!ipLimit.allowed || !emailLimit.allowed) {
    const retryAfterMs = Math.max(ipLimit.retryAfterMs, emailLimit.retryAfterMs);
    return {
      formError: `Too many attempts. Please try again in ${formatRetryAfter(retryAfterMs)}.`,
    };
  }

  await connectToDatabase();
  const user = await User.findOne({ email });

  // Always report success, whether or not the email is registered, so the
  // response can't be used to enumerate which addresses have accounts.
  if (user) {
    const { token: rawToken, tokenHash, expiresAt } = generateVerificationToken(RESET_TOKEN_TTL_MS);
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetTokenExpiresAt = expiresAt;
    await user.save();

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;
    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (err) {
      console.error("Failed to send password reset email", err);
    }
  }

  return { success: true };
}
