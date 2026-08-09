import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/permissions";
import { CreateMemberForm } from "./create-member-form";

export default async function CreateMemberPage() {
  await requirePermission("members.create");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Create member</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Creates an approved, verified member account with a new company. A temporary password
          is emailed to them.
        </p>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Member details</CardTitle>
          <CardDescription>The member will be able to change their password after logging in.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateMemberForm />
        </CardContent>
      </Card>
    </div>
  );
}
