import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionPermissions, hasAnyPermission, hasPermission, requireAdminSession } from "@/lib/permissions";
import { Company, GroupTour, Property, Role, Settings, User, Vehicle } from "@/models";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  const permissions = await getSessionPermissions(session.user.roles);

  const canApproveMembers = hasPermission(permissions, "members.approve");
  const canManageCompanies = hasPermission(permissions, "companies.manage");
  const canViewProperties = hasPermission(permissions, "properties.view");
  const canViewGroupTours = hasPermission(permissions, "groupTours.view");
  const canViewVehicles = hasPermission(permissions, "vehicles.view");
  const canAccessRoles = hasAnyPermission(permissions, ["roles.manage", "roles.assign"]);
  const canManageSettings = hasPermission(permissions, "settings.manage");

  await connectToDatabase();

  const [
    pendingCount,
    approvedCount,
    unverifiedCount,
    blockedCount,
    companyCount,
    propertyCount,
    groupTourCount,
    openGroupTourCount,
    vehicleCount,
    roleCount,
    settings,
  ] = await Promise.all([
    canApproveMembers ? User.countDocuments({ status: "pending_approval" }) : null,
    canApproveMembers ? User.countDocuments({ status: "approved" }) : null,
    canApproveMembers ? User.countDocuments({ status: "pending_email" }) : null,
    canApproveMembers ? User.countDocuments({ status: "suspended" }) : null,
    canManageCompanies ? Company.countDocuments() : null,
    canViewProperties ? Property.countDocuments() : null,
    canViewGroupTours ? GroupTour.countDocuments() : null,
    canViewGroupTours ? GroupTour.countDocuments({ isFull: false }) : null,
    canViewVehicles ? Vehicle.countDocuments() : null,
    canAccessRoles ? Role.countDocuments() : null,
    canManageSettings ? Settings.findOne({ key: "singleton" }).lean() : null,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome, {session.user.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          An overview of members, companies, and listings across ETTAB.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {canApproveMembers && (
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>Registration status across all accounts.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Stat label="Pending" value={pendingCount ?? 0} />
              <Stat label="Approved" value={approvedCount ?? 0} />
              <Stat label="Unverified" value={unverifiedCount ?? 0} />
              <Stat label="Blocked" value={blockedCount ?? 0} />
            </CardContent>
          </Card>
        )}

        {canManageCompanies && (
          <Card>
            <CardHeader>
              <CardTitle>Companies</CardTitle>
              <CardDescription>Hoteliers, tour operators, and car vendors.</CardDescription>
            </CardHeader>
            <CardContent>
              <Stat label="Total companies" value={companyCount ?? 0} />
            </CardContent>
          </Card>
        )}

        {canViewProperties && (
          <Card>
            <CardHeader>
              <CardTitle>Properties</CardTitle>
              <CardDescription>Hotels and homestays listed by members.</CardDescription>
            </CardHeader>
            <CardContent>
              <Stat label="Total properties" value={propertyCount ?? 0} />
            </CardContent>
          </Card>
        )}

        {canViewGroupTours && (
          <Card>
            <CardHeader>
              <CardTitle>Group tours</CardTitle>
              <CardDescription>Tours listed across all companies.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Stat label="Total tours" value={groupTourCount ?? 0} />
              <Stat label="Open" value={openGroupTourCount ?? 0} />
            </CardContent>
          </Card>
        )}

        {canViewVehicles && (
          <Card>
            <CardHeader>
              <CardTitle>Vehicles</CardTitle>
              <CardDescription>Cars and other vehicles listed by car vendors.</CardDescription>
            </CardHeader>
            <CardContent>
              <Stat label="Total vehicles" value={vehicleCount ?? 0} />
            </CardContent>
          </Card>
        )}

        {canAccessRoles && (
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>Roles available for assignment.</CardDescription>
            </CardHeader>
            <CardContent>
              <Stat label="Total roles" value={roleCount ?? 0} />
            </CardContent>
          </Card>
        )}

        {canManageSettings && (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Site-wide behavior.</CardDescription>
            </CardHeader>
            <CardContent>
              <Stat
                label="Auto-verification"
                value={settings?.autoVerification ? "On" : "Off"}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
