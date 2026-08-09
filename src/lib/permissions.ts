import { getServerSession, type Session } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import {
  ADMIN_AREA_ROLE_NAMES,
  hasPermission,
  PERMISSIONS,
  PERMISSION_LABELS,
  type Permission,
} from "@/lib/permission-constants";
import { Role, User } from "@/models";

export {
  ADMIN_AREA_ROLE_NAMES,
  hasPermission,
  PERMISSIONS,
  PERMISSION_LABELS,
  type Permission,
};

export async function getSessionPermissions(roleNames: string[]): Promise<Set<string>> {
  await connectToDatabase();
  const roles = await Role.find({ name: { $in: roleNames } }).lean();
  const permissions = new Set<string>();
  for (const role of roles) {
    for (const permission of role.permissions) {
      permissions.add(permission);
    }
  }
  return permissions;
}

export async function requireAdminSession(): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.roles.some((role) => (ADMIN_AREA_ROLE_NAMES as readonly string[]).includes(role))) {
    redirect("/admin/login");
  }
  return session;
}

export async function requirePermission(
  permission: Permission
): Promise<{ session: Session; permissions: Set<string> }> {
  const session = await requireAdminSession();
  const permissions = await getSessionPermissions(session.user.roles);
  if (!hasPermission(permissions, permission)) {
    redirect("/admin");
  }
  return { session, permissions };
}

export function hasAnyPermission(permissions: Set<string>, perms: Permission[]): boolean {
  return perms.some((permission) => hasPermission(permissions, permission));
}

export async function requireAnyPermission(
  perms: Permission[]
): Promise<{ session: Session; permissions: Set<string> }> {
  const session = await requireAdminSession();
  const permissions = await getSessionPermissions(session.user.roles);
  if (!hasAnyPermission(permissions, perms)) {
    redirect("/admin");
  }
  return { session, permissions };
}

export async function getUsersWithPermission(
  permission: Permission
): Promise<{ id: string; name: string; email: string }[]> {
  await connectToDatabase();
  const roles = await Role.find({ permissions: { $in: [permission, "*"] } }).select("_id").lean();
  const roleIds = roles.map((role) => role._id);
  if (roleIds.length === 0) {
    return [];
  }
  const users = await User.find({ status: "approved", roleIds: { $in: roleIds } })
    .select("name email")
    .lean();
  return users.map((user) => ({ id: user._id.toString(), name: user.name, email: user.email }));
}
