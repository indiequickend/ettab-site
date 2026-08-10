"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface BottomNavItem {
  href?: string;
  label: string;
  icon: ReactNode;
  action?: "sign-out";
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard" || href === "/admin") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav({ items }: { items: BottomNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary"
    >
      {items.map((item) => {
        if (item.action === "sign-out") {
          return (
            <button
              key="sign-out"
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        }

        const active = isActive(pathname, item.href!);
        return (
          <Link
            key={item.href}
            href={item.href!}
            className={cn(
              "flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
