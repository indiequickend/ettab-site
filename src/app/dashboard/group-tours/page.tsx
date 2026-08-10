import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getActiveCompany, requireMemberSession } from "@/lib/company-context";
import { getGroupToursForCompany } from "@/lib/group-tours";
import { CompanySwitcher } from "../company/company-switcher";
import { GroupTourManagementList } from "./group-tour-management-list";

export default async function GroupToursPage() {
  const session = await requireMemberSession();
  const active = await getActiveCompany(session.user.id!);

  if (!active) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>No company found</CardTitle>
            <CardDescription>
              You aren&apos;t linked to any company yet. Contact ETTAB admin if you believe this is
              a mistake.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard" className="text-sm underline">
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { company, memberships } = active;

  if (!company.memberTypes.includes("tour_operator")) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Group tours are for tour operators</CardTitle>
            <CardDescription>
              Add &quot;Tour Operator&quot; to {company.name}&apos;s member types to manage group
              tours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/company" className="text-sm underline">
              Edit company details
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const tours = await getGroupToursForCompany(company.id);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Group tours</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the group tours listed under {company.name}.
        </p>
        <Link href="/dashboard" className="mt-2 inline-block text-sm underline">
          Back to dashboard
        </Link>
      </div>

      {memberships.length > 1 && (
        <CompanySwitcher memberships={memberships} activeCompanyId={company.id} />
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Your group tours</h2>
          <Link
            href="/dashboard/group-tours/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            New group tour
          </Link>
        </div>
        <GroupTourManagementList tours={tours} />
      </div>
    </div>
  );
}
