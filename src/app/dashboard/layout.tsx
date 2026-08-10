import { Home, Search, Building2, UserCircle, ShieldCheck, LogOut } from "lucide-react";

import { BottomNav, type BottomNavItem } from "@/components/bottom-nav";
import { requireMemberSession } from "@/lib/company-context";
import { ADMIN_AREA_ROLE_NAMES } from "@/lib/permission-constants";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await requireMemberSession();
  const isAdmin = session.user.roles.some((role) =>
    (ADMIN_AREA_ROLE_NAMES as readonly string[]).includes(role)
  );

  const iconProps = { className: "size-5", "aria-hidden": true } as const;
  const navItems: BottomNavItem[] = [
    { href: "/dashboard", label: "Home", icon: <Home {...iconProps} /> },
    { href: "/dashboard/search", label: "Search", icon: <Search {...iconProps} /> },
    { href: "/dashboard/company", label: "Company", icon: <Building2 {...iconProps} /> },
    { href: "/dashboard/account", label: "Account", icon: <UserCircle {...iconProps} /> },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: <ShieldCheck {...iconProps} /> }] : []),
    { label: "Logout", icon: <LogOut {...iconProps} />, action: "sign-out" as const },
  ];

  return (
    <div className="flex flex-1 flex-col pb-20 md:pb-0">
      {children}
      <BottomNav items={navItems} />
    </div>
  );
}
