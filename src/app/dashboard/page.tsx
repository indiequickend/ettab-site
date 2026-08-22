import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getActiveCompany, requireMemberSession } from "@/lib/company-context";
import { getUpcomingGroupTours } from "@/lib/group-tours";
import { SignOutButton } from "./sign-out-button";
import { GroupToursFeed } from "./group-tours-feed";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireMemberSession();
  const { q } = await searchParams;
  const query = q ?? "";
  const active = await getActiveCompany(session.user.id!);
  const memberTypes = active?.company.memberTypes ?? [];

  const { tours, hasMore } = await getUpcomingGroupTours({ query, offset: 0, limit: 12 });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome, {session.user.name}
        </h1>
        {/* <p className="mt-1 text-sm text-muted-foreground">
          Roles: {session.user.roles.join(", ") || "member"}
        </p> */}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/search"
          className={cn(buttonVariants({ variant: "outline" }), "hidden md:inline-flex")}
        >
          Find a member
        </Link>
        <Link
          href="/dashboard/company"
          className={cn(buttonVariants({ variant: "outline" }), "hidden md:inline-flex")}
        >
          My company
        </Link>
        {memberTypes.includes("hotelier") && (
          <Link href="/dashboard/properties" className={cn(buttonVariants({ variant: "outline" }))}>
            My Properties
          </Link>
        )}
        {(memberTypes.includes("tour_operator") || memberTypes.includes("car_vendor")) && (
          <Link
            href="/dashboard/service-areas"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            My Service Areas
          </Link>
        )}
        {memberTypes.includes("tour_operator") && (
          <Link
            href="/dashboard/group-tours"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            My Group Tours
          </Link>
        )}
        {memberTypes.includes("car_vendor") && (
          <Link href="/dashboard/vehicles" className={cn(buttonVariants({ variant: "outline" }))}>
            My Vehicles
          </Link>
        )}
        <Link
          href="/dashboard/account"
          className={cn(buttonVariants({ variant: "outline" }), "hidden md:inline-flex")}
        >
          Account settings
        </Link>
        <div className="hidden md:block">
          <SignOutButton />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Upcoming group tours</h2>
        <GroupToursFeed key={query} initialQuery={query} initialTours={tours} initialHasMore={hasMore} />
      </div>
    </div>
  );
}
