import Link from "next/link";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionPermissions, hasPermission, requireAdminSession } from "@/lib/permissions";
import { User } from "@/models";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  const permissions = await getSessionPermissions(session.user.roles);

  const canApproveMembers = hasPermission(permissions, "members.approve");
  const canManageRoles = hasPermission(permissions, "roles.manage");
  const canManageSettings = hasPermission(permissions, "settings.manage");

  let pendingCount = 0;
  if (canApproveMembers) {
    await connectToDatabase();
    pendingCount = await User.countDocuments({ status: "pending_approval" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome, {session.user.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage member approvals, roles, and site settings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {canApproveMembers && (
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              {pendingCount > 0 && (
                <CardAction>
                  <Badge variant="secondary">{pendingCount} pending</Badge>
                </CardAction>
              )}
              <CardDescription>Review and approve or reject pending registrations.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/members" className={cn(buttonVariants({ variant: "outline" }))}>
                Go to Members
              </Link>
            </CardContent>
          </Card>
        )}

        {canManageRoles && (
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>Create and edit roles, and assign them to members.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/roles" className={cn(buttonVariants({ variant: "outline" }))}>
                Go to Roles
              </Link>
            </CardContent>
          </Card>
        )}

        {canManageSettings && (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Control site-wide behavior like auto-verification.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/settings" className={cn(buttonVariants({ variant: "outline" }))}>
                Go to Settings
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
