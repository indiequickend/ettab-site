import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getActiveCompany, requireMemberSession } from "@/lib/company-context";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const session = await requireMemberSession();
  const active = await getActiveCompany(session.user.id!);
  const memberTypes = active?.company.memberTypes ?? [];

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Welcome, {session.user.name}
      </h1>
      <p className="text-sm text-muted-foreground sm:text-base">
        Roles: {session.user.roles.join(", ") || "member"}
      </p>
      <Link href="/dashboard/company" className={cn(buttonVariants({ variant: "outline" }))}>
        Manage my company
      </Link>
      {memberTypes.includes("hotelier") && (
        <Link href="/dashboard/properties" className={cn(buttonVariants({ variant: "outline" }))}>
          Manage properties
        </Link>
      )}
      {(memberTypes.includes("tour_operator") || memberTypes.includes("car_vendor")) && (
        <Link
          href="/dashboard/service-areas"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Manage service areas
        </Link>
      )}
      <Link href="/dashboard/account" className={cn(buttonVariants({ variant: "outline" }))}>
        Account settings
      </Link>
      <SignOutButton />
    </main>
  );
}
