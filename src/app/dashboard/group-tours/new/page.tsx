import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCompany, requireMemberSession } from "@/lib/company-context";
import { GroupTourForm } from "../group-tour-form";

export default async function NewGroupTourPage() {
  const session = await requireMemberSession();
  const active = await getActiveCompany(session.user.id!);

  if (!active || !active.company.memberTypes.includes("tour_operator")) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Group tours are for tour operators</CardTitle>
            <CardDescription>
              You need an active company with the &quot;Tour Operator&quot; member type to add
              group tours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/group-tours" className="text-sm underline">
              Back to group tours
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">New group tour</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new group tour for {active.company.name}.
        </p>
        <Link href="/dashboard/group-tours" className="mt-2 inline-block text-sm underline">
          Back to group tours
        </Link>
      </div>

      <GroupTourForm mode="create" companyId={active.company.id} />
    </div>
  );
}
