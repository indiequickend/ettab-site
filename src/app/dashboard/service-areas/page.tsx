import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCompany, requireMemberSession } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { ServiceArea, type IPlace } from "@/models";
import { CompanySwitcher } from "../company/company-switcher";
import { AddServiceAreaForm } from "./add-service-area-form";
import { ServiceAreaBadges, type ServiceAreaRow } from "./service-area-badges";

export default async function ServiceAreasPage() {
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

  if (!company.memberTypes.includes("tour_operator") && !company.memberTypes.includes("car_vendor")) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Service areas are for tour operators &amp; car vendors</CardTitle>
            <CardDescription>
              Add &quot;Tour Operator&quot; or &quot;Car Vendor&quot; to {company.name}&apos;s member
              types to manage service areas.
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
  const serviceAreaDocs = await ServiceArea.find({ companyId: company.id })
    .populate<{ placeId: IPlace }>("placeId")
    .sort({ createdAt: -1 })
    .lean();

  const serviceAreas: ServiceAreaRow[] = serviceAreaDocs.map((serviceArea) => ({
    id: serviceArea._id.toString(),
    place: {
      id: serviceArea.placeId._id.toString(),
      name: serviceArea.placeId.name,
      isState: serviceArea.placeId.isState,
    },
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Service areas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the places {company.name} operates in or covers.
        </p>
      </div>

      {memberships.length > 1 && (
        <CompanySwitcher memberships={memberships} activeCompanyId={company.id} />
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Your service areas</h2>
        <ServiceAreaBadges serviceAreas={serviceAreas} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Add a service area</h2>
        <AddServiceAreaForm companyId={company.id} />
      </div>
    </div>
  );
}
