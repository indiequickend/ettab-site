"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionPermissions, hasAnyPermission, hasPermission } from "@/lib/permissions";
import { assignRolesSchema, roleFormSchema } from "@/lib/validation/admin";
import { Role, User } from "@/models";

export interface RoleFormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

async function requireRolesManagePermission() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: "Not authenticated." } as const;
  }
  const permissions = await getSessionPermissions(session.user.roles);
  if (!hasPermission(permissions, "roles.manage")) {
    return { error: "You do not have permission to do this." } as const;
  }
  return { session } as const;
}

async function requireRolesAssignPermission() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: "Not authenticated." } as const;
  }
  const permissions = await getSessionPermissions(session.user.roles);
  if (!hasAnyPermission(permissions, ["roles.manage", "roles.assign"])) {
    return { error: "You do not have permission to do this." } as const;
  }
  return { session } as const;
}

export async function createRoleAction(
  _prevState: RoleFormState,
  formData: FormData
): Promise<RoleFormState> {
  const auth = await requireRolesManagePermission();
  if ("error" in auth) {
    return { formError: auth.error };
  }

  const parsed = roleFormSchema.safeParse({
    name: formData.get("name"),
    permissions: formData.getAll("permissions"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await connectToDatabase();
  try {
    await Role.create({ name: parsed.data.name, permissions: parsed.data.permissions, isSystem: false });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return { fieldErrors: { name: ["A role with this name already exists."] } };
    }
    throw err;
  }

  revalidatePath("/admin/roles");
  return {};
}

export async function updateRoleAction(
  _prevState: RoleFormState,
  formData: FormData
): Promise<RoleFormState> {
  const auth = await requireRolesManagePermission();
  if ("error" in auth) {
    return { formError: auth.error };
  }

  const roleId = String(formData.get("roleId") ?? "");
  const parsed = roleFormSchema.safeParse({
    name: formData.get("name"),
    permissions: formData.getAll("permissions"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await connectToDatabase();
  const role = await Role.findById(roleId);
  if (!role) {
    return { formError: "This role could not be found." };
  }
  if (role.name === "superadmin") {
    return { formError: "The superadmin role cannot be edited." };
  }
  if (role.isSystem && parsed.data.name !== role.name) {
    return { fieldErrors: { name: ["System role names cannot be changed."] } };
  }

  if (!role.isSystem) {
    role.name = parsed.data.name;
  }
  role.permissions = parsed.data.permissions;

  try {
    await role.save();
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return { fieldErrors: { name: ["A role with this name already exists."] } };
    }
    throw err;
  }

  revalidatePath("/admin/roles");
  return {};
}

export async function deleteRoleAction(
  _prevState: RoleFormState,
  formData: FormData
): Promise<RoleFormState> {
  const auth = await requireRolesManagePermission();
  if ("error" in auth) {
    return { formError: auth.error };
  }

  const roleId = String(formData.get("roleId") ?? "");

  await connectToDatabase();
  const role = await Role.findById(roleId);
  if (!role) {
    return { formError: "This role could not be found." };
  }
  if (role.isSystem) {
    return { formError: "System roles cannot be deleted." };
  }
  const inUse = await User.exists({ roleIds: role._id });
  if (inUse) {
    return { formError: "This role is assigned to one or more users. Reassign them first." };
  }

  await role.deleteOne();

  revalidatePath("/admin/roles");
  return {};
}

export async function updateUserRolesAction(
  _prevState: RoleFormState,
  formData: FormData
): Promise<RoleFormState> {
  const auth = await requireRolesAssignPermission();
  if ("error" in auth) {
    return { formError: auth.error };
  }

  const parsed = assignRolesSchema.safeParse({
    userId: formData.get("userId"),
    roleIds: formData.getAll("roleIds"),
  });
  if (!parsed.success) {
    return { formError: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  await connectToDatabase();
  const [user, roles] = await Promise.all([
    User.findById(parsed.data.userId),
    Role.find({ _id: { $in: parsed.data.roleIds } }),
  ]);
  if (!user) {
    return { formError: "This member could not be found." };
  }
  if (roles.length !== parsed.data.roleIds.length) {
    return { formError: "One or more selected roles could not be found." };
  }

  const superadminRole = await Role.findOne({ name: "superadmin" });
  const userHadSuperadmin = superadminRole
    ? user.roleIds.some((id) => id.equals(superadminRole._id))
    : false;
  const willHaveSuperadmin = superadminRole
    ? parsed.data.roleIds.includes(superadminRole._id.toString())
    : false;

  if (superadminRole && userHadSuperadmin && !willHaveSuperadmin) {
    const superadminCount = await User.countDocuments({ roleIds: superadminRole._id });
    if (superadminCount <= 1) {
      return { formError: "Cannot remove the last superadmin's superadmin role." };
    }
  }

  user.roleIds = roles.map((role) => role._id);
  await user.save();

  revalidatePath("/admin/roles");
  revalidatePath("/admin/members");
  return {};
}
