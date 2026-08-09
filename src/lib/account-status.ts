"use server";

import { connectToDatabase } from "@/lib/mongodb";
import { User, type UserStatus } from "@/models";
import { checkRateLimit, formatRetryAfter, getClientIp } from "@/lib/rate-limit";

const ACCOUNT_STATUS_RATE_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 };

export async function getAccountStatus(
  email: string
): Promise<{ exists: boolean; status?: UserStatus; rateLimited?: boolean; retryAfter?: string }> {
  const ip = await getClientIp();
  const rateLimit = await checkRateLimit(`account-status:${ip}`, ACCOUNT_STATUS_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return { exists: false, rateLimited: true, retryAfter: formatRetryAfter(rateLimit.retryAfterMs) };
  }

  await connectToDatabase();
  const user = await User.findOne({ email: email.trim().toLowerCase() })
    .select("status")
    .lean<{ status: UserStatus }>();

  if (!user) {
    return { exists: false };
  }

  return { exists: true, status: user.status };
}
