export const PERMISSIONS = [
  "roles.manage",
  "roles.assign",
  "members.approve",
  "members.create",
  "settings.manage",
  "company.manage_own",
  "property.manage_own",
  "serviceArea.manage_own",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "roles.manage": "Manage roles",
  "roles.assign": "Assign roles to members",
  "members.approve": "Approve members",
  "members.create": "Create members",
  "settings.manage": "Manage settings",
  "company.manage_own": "Manage own company",
  "property.manage_own": "Manage own properties",
  "serviceArea.manage_own": "Manage own service areas",
};

export const ADMIN_AREA_ROLE_NAMES = ["superadmin", "admin"] as const;

export function hasPermission(permissions: Set<string>, permission: Permission): boolean {
  return permissions.has("*") || permissions.has(permission);
}
