import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCompany, requireMemberSession } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { Vehicle, type IPlace } from "@/models";
import { CompanySwitcher } from "../company/company-switcher";
import { AddVehicleForm } from "./add-vehicle-form";
import { VehicleList, type VehicleRow } from "./vehicle-list";

export default async function VehiclesPage() {
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

  if (!company.memberTypes.includes("car_vendor")) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Vehicles are for car vendors</CardTitle>
            <CardDescription>
              Add &quot;Car Vendor&quot; to {company.name}&apos;s member types to manage vehicles.
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

  await connectToDatabase();
  const vehicleDocs = await Vehicle.find({ companyId: company.id })
    .populate<{ placeId: IPlace }>("placeId")
    .sort({ createdAt: -1 })
    .lean();

  const vehicles: VehicleRow[] = vehicleDocs.map((vehicle) => ({
    id: vehicle._id.toString(),
    name: vehicle.name,
    place: {
      id: vehicle.placeId._id.toString(),
      name: vehicle.placeId.name,
      isState: vehicle.placeId.isState,
    },
    vehicleType: vehicle.vehicleType,
    capacity: vehicle.capacity,
    rateB2B: vehicle.rateB2B,
    rateB2C: vehicle.rateB2C,
    photoLinks: vehicle.photoLinks,
    googleBusinessLink: vehicle.googleBusinessLink,
    facebookLink: vehicle.facebookLink,
    website: vehicle.website,
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Vehicles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the vehicles listed under {company.name}.
        </p>
      </div>

      {memberships.length > 1 && (
        <CompanySwitcher memberships={memberships} activeCompanyId={company.id} />
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Your vehicles</h2>
          <AddVehicleForm companyId={company.id} />
        </div>
        <VehicleList vehicles={vehicles} />
      </div>
    </div>
  );
}
