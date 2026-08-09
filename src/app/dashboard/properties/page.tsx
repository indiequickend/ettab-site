import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCompany, requireMemberSession } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { Property, type IPlace } from "@/models";
import { CompanySwitcher } from "../company/company-switcher";
import { AddPropertyForm } from "./add-property-form";
import { PropertyList, type PropertyRow } from "./property-list";

export default async function PropertiesPage() {
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

  if (!company.memberTypes.includes("hotelier")) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Properties are for hoteliers</CardTitle>
            <CardDescription>
              Add &quot;Hotelier&quot; to {company.name}&apos;s member types to manage properties.
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
  const propertyDocs = await Property.find({ companyId: company.id })
    .populate<{ placeId: IPlace }>("placeId")
    .sort({ createdAt: -1 })
    .lean();

  const properties: PropertyRow[] = propertyDocs.map((property) => ({
    id: property._id.toString(),
    name: property.name,
    place: {
      id: property.placeId._id.toString(),
      name: property.placeId.name,
      isState: property.placeId.isState,
    },
    category: property.category,
    totalRooms: property.totalRooms,
    capacity: property.capacity,
    rateB2B: property.rateB2B,
    rateB2C: property.rateB2C,
    photoLinks: property.photoLinks,
    googleBusinessLink: property.googleBusinessLink,
    facebookLink: property.facebookLink,
    website: property.website,
  }));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Properties</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the hotels and homestays listed under {company.name}.
        </p>
      </div>

      {memberships.length > 1 && (
        <CompanySwitcher memberships={memberships} activeCompanyId={company.id} />
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Your properties</h2>
          <AddPropertyForm companyId={company.id} />
        </div>
        <PropertyList properties={properties} />
      </div>
    </div>
  );
}
