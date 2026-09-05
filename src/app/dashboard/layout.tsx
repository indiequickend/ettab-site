import Link from "next/link";
import {
  Home,
  Search,
  Building2,
  UserCircle,
  ShieldCheck,
  LogOut,
  Hotel,
  MapPinned,
  CalendarRange,
  Car,
} from "lucide-react";

import { BottomNav, type BottomNavItem } from "@/components/bottom-nav";
import { getActiveCompany, requireMemberSession } from "@/lib/company-context";
import { ADMIN_AREA_ROLE_NAMES } from "@/lib/permission-constants";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await requireMemberSession();
  const isAdmin = session.user.roles.some((role) =>
    (ADMIN_AREA_ROLE_NAMES as readonly string[]).includes(role)
  );
  const active = await getActiveCompany(session.user.id!);
  const memberTypes = active?.company.memberTypes ?? [];

  const navLinks = [
    { href: "/dashboard", label: "Home", icon: Home, show: true },
    { href: "/dashboard/search", label: "Search", icon: Search, show: true },
    { href: "/dashboard/company", label: "Company", icon: Building2, show: true },
    {
      href: "/dashboard/properties",
      label: "Properties",
      icon: Hotel,
      show: memberTypes.includes("hotelier"),
    },
    {
      href: "/dashboard/service-areas",
      label: "Service Areas",
      icon: MapPinned,
      show: memberTypes.includes("tour_operator") || memberTypes.includes("car_vendor"),
    },
    {
      href: "/dashboard/group-tours",
      label: "Group Tours",
      icon: CalendarRange,
      show: memberTypes.includes("tour_operator"),
    },
    {
      href: "/dashboard/vehicles",
      label: "Vehicles",
      icon: Car,
      show: memberTypes.includes("car_vendor"),
    },
    { href: "/dashboard/account", label: "Account", icon: UserCircle, show: true },
  ] as const;
  const visibleNavLinks = navLinks.filter((link) => link.show);

  const iconProps = { className: "size-5", "aria-hidden": true } as const;
  const bottomNavItems: BottomNavItem[] = [
    { href: "/dashboard", label: "Home", icon: <Home {...iconProps} /> },
    { href: "/dashboard/search", label: "Search", icon: <Search {...iconProps} /> },
    { href: "/dashboard/company", label: "Company", icon: <Building2 {...iconProps} /> },
    { href: "/dashboard/account", label: "Account", icon: <UserCircle {...iconProps} /> },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: <ShieldCheck {...iconProps} /> }] : []),
    { label: "Logout", icon: <LogOut {...iconProps} />, action: "sign-out" as const },
  ];

  return (
    <div className="flex flex-1 flex-col pb-20 md:pb-0">
      <header className="hidden items-center justify-between gap-4 border-b px-4 py-3 sm:px-6 md:flex">
        <nav className="flex flex-wrap items-center gap-4">
          {visibleNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <link.icon className="size-4" aria-hidden="true" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              Admin
            </Link>
          )}
          <SignOutButton />
        </div>
      </header>
      {children}
      <BottomNav items={bottomNavItems} />
    </div>
  );
}
