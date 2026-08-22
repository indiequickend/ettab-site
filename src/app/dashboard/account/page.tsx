import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCompany, requireMemberSession } from "@/lib/company-context";
import { CompanyDetailsCard } from "../company/company-details-card";
import { CompanySwitcher } from "../company/company-switcher";
import { ChangePasswordForm } from "./change-password-form";

export default async function AccountPage() {
  const session = await requireMemberSession();
  const active = await getActiveCompany(session.user.id!);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Account settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Signed in as {session.user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>Enter your current password and choose a new one.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {active && (
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-medium">Business type</h2>
            <p className="text-sm text-muted-foreground">
              Update what {active.company.name} does — you can be a hotelier, tour operator, and/or
              car vendor at once.
            </p>
          </div>
          {active.memberships.length > 1 && (
            <CompanySwitcher memberships={active.memberships} activeCompanyId={active.company.id} />
          )}
          <CompanyDetailsCard company={active.company} />
        </div>
      )}
    </div>
  );
}
