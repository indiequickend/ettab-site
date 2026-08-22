"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { EllipsisVerticalIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

function NavAction({
  item,
  active,
  onNavigate,
  className,
}: {
  item: BottomNavItem;
  active: boolean;
  onNavigate?: () => void;
  className: string;
}) {
  if (item.action === "sign-out") {
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          signOut({ callbackUrl: "/login" });
        }}
        className={className}
      >
        {item.icon}
        <span>{item.label}</span>
      </button>
    );
  }

  return (
    <Link
      href={item.href!}
      onClick={onNavigate}
      className={className}
      aria-current={active ? "page" : undefined}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );
}

export function BottomNav({
  items,
  overflowItems,
}: {
  items: BottomNavItem[];
  overflowItems?: BottomNavItem[];
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const hasOverflow = Boolean(overflowItems && overflowItems.length > 0);
  const overflowActive =
    hasOverflow && overflowItems!.some((item) => item.href && isActive(pathname, item.href));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary"
    >
      {items.map((item) => (
        <NavAction
          key={item.href ?? item.action}
          item={item}
          active={Boolean(item.href && isActive(pathname, item.href))}
          className={cn(
            "flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
            item.href && isActive(pathname, item.href)
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        />
      ))}

      {hasOverflow && (
        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  overflowActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              />
            }
          >
            <EllipsisVerticalIcon className="size-5" aria-hidden="true" />
            <span>More</span>
          </PopoverTrigger>
          <PopoverContent align="end" side="top" className="w-44 gap-1 p-1">
            {overflowItems!.map((item) => (
              <NavAction
                key={item.href ?? item.action}
                item={item}
                active={Boolean(item.href && isActive(pathname, item.href))}
                onNavigate={() => setMoreOpen(false)}
                className={cn(
                  "flex flex-row items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-normal transition-colors",
                  item.href && isActive(pathname, item.href)
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              />
            ))}
          </PopoverContent>
        </Popover>
      )}
    </nav>
  );
}
