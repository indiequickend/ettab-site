"use server";

import { connectToDatabase } from "@/lib/mongodb";
import { User, type UserStatus } from "@/models";

export async function getAccountStatus(
  email: string
): Promise<{ exists: boolean; status?: UserStatus }> {
  await connectToDatabase();
  const user = await User.findOne({ email: email.trim().toLowerCase() })
    .select("status")
    .lean<{ status: UserStatus }>();

  if (!user) {
    return { exists: false };
  }

  return { exists: true, status: user.status };
}
