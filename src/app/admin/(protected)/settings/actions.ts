"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth-options";
import { getSessionPermissions, hasPermission } from "@/lib/permissions";
import { updateSettings } from "@/lib/settings";

export async function updateAutoVerificationAction(
  next: boolean
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { ok: false, error: "Not authenticated." };
  }
  const permissions = await getSessionPermissions(session.user.roles);
  if (!hasPermission(permissions, "settings.manage")) {
    return { ok: false, error: "You do not have permission to do this." };
  }

  await updateSettings({ autoVerification: next });
  revalidatePath("/admin/settings");
  return { ok: true };
}
