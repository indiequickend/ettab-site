import { headers } from "next/headers";

import { connectToDatabase } from "@/lib/mongodb";
import { RateLimitAttempt } from "@/models";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

export async function checkRateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): Promise<RateLimitResult> {
  await connectToDatabase();
  const now = new Date();

  const bumped = await RateLimitAttempt.findOneAndUpdate(
    { key, expiresAt: { $gt: now } },
    { $inc: { count: 1 } },
    { new: true }
  );

  if (bumped) {
    if (bumped.count > max) {
      return { allowed: false, retryAfterMs: bumped.expiresAt.getTime() - now.getTime() };
    }
    return { allowed: true, retryAfterMs: 0 };
  }

  try {
    await RateLimitAttempt.findOneAndUpdate(
      { key, expiresAt: { $lte: now } },
      { $set: { count: 1, expiresAt: new Date(now.getTime() + windowMs) } },
      { upsert: true }
    );
  } catch {
    // Lost a race with another concurrent first-attempt for the same key -
    // the other request's insert won, so just count this one against it.
    await RateLimitAttempt.findOneAndUpdate(
      { key, expiresAt: { $gt: now } },
      { $inc: { count: 1 } }
    );
  }

  return { allowed: true, retryAfterMs: 0 };
}

/** Best-effort client IP from forwarding headers (works behind Vercel's proxy). */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headerList.get("x-real-ip") ?? "unknown";
}

export function formatRetryAfter(retryAfterMs: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60000));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
