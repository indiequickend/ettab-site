import Link from "next/link";

import { AdminSignOutButton } from "@/app/admin/sign-out-button";
import { getSessionPermissions, hasPermission, requireAdminSession } from "@/lib/permissions";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdminSession();
  const permissions = await getSessionPermissions(session.user.roles);

  const navLinks = [
    { href: "/admin", label: "Dashboard", show: true },
    { href: "/admin/members", label: "Members", show: hasPermission(permissions, "members.approve") },
    { href: "/admin/roles", label: "Roles", show: hasPermission(permissions, "roles.manage") },
    { href: "/admin/settings", label: "Settings", show: hasPermission(permissions, "settings.manage") },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <span className="font-heading text-sm font-semibold tracking-tight">ETTAB Admin</span>
          <nav className="flex items-center gap-4">
            {navLinks
              .filter((link) => link.show)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
          </nav>
        </div>
        <AdminSignOutButton />
      </header>
      <main className="flex flex-1 flex-col px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
