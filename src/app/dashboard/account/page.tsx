import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireMemberSession } from "@/lib/company-context";
import { ChangePasswordForm } from "./change-password-form";

export default async function AccountPage() {
  const session = await requireMemberSession();

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
    </div>
  );
}
