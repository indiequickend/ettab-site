import Link from "next/link";
import { LayoutDashboard, Users, ShieldCheck, Settings } from "lucide-react";

import { AdminSignOutButton } from "@/app/admin/sign-out-button";
import { BottomNav, type BottomNavItem } from "@/components/bottom-nav";
import { getSessionPermissions, hasAnyPermission, hasPermission, requireAdminSession } from "@/lib/permissions";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdminSession();
  const permissions = await getSessionPermissions(session.user.roles);

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, show: true },
    {
      href: "/admin/members",
      label: "Members",
      icon: Users,
      show: hasPermission(permissions, "members.approve"),
    },
    {
      href: "/admin/roles",
      label: "Roles",
      icon: ShieldCheck,
      show: hasAnyPermission(permissions, ["roles.manage", "roles.assign"]),
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
      show: hasPermission(permissions, "settings.manage"),
    },
  ];
  const visibleNavLinks = navLinks.filter((link) => link.show);
  const bottomNavItems: BottomNavItem[] = visibleNavLinks.map(({ href, label, icon: Icon }) => ({
    href,
    label,
    icon: <Icon className="size-5" aria-hidden="true" />,
  }));

  return (
    <div className="flex flex-1 flex-col pb-20 md:pb-0">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-3 sm:px-6">
        <div className="hidden items-center gap-6 md:flex">
          <span className="font-heading text-sm font-semibold tracking-tight">ETTAB Admin</span>
          <nav className="flex items-center gap-4">
            {visibleNavLinks.map((link) => (
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
        <span className="font-heading text-sm font-semibold tracking-tight md:hidden">ETTAB Admin</span>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Member area
          </Link>
          <AdminSignOutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col px-4 py-8 sm:px-6">{children}</main>
      <BottomNav items={bottomNavItems} />
    </div>
  );
}
