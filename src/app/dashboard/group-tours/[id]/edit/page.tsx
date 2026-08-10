import Link from "next/link";
import { notFound } from "next/navigation";

import { getActiveCompany, requireMemberSession } from "@/lib/company-context";
import { getGroupTourDetail } from "@/lib/group-tours";
import { GroupTourForm } from "../../group-tour-form";

export default async function EditGroupTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireMemberSession();
  const { id } = await params;
  const active = await getActiveCompany(session.user.id!);
  const tour = await getGroupTourDetail(id, active?.company.id ?? null);

  if (!tour || !tour.isOwner) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Edit group tour</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the details for {tour.title}.
        </p>
        <Link href="/dashboard/group-tours" className="mt-2 inline-block text-sm underline">
          Back to group tours
        </Link>
      </div>

      <GroupTourForm
        mode="edit"
        companyId={tour.companyId}
        tour={{
          id: tour.id,
          title: tour.title,
          startDate: tour.startDate.toISOString(),
          endDate: tour.endDate.toISOString(),
          durationLabel: tour.durationLabel,
          totalSeats: tour.totalSeats,
          bookedSeats: tour.bookedSeats,
          rateB2B: tour.rateB2B,
          rateB2C: tour.rateB2C,
          description: tour.description,
        }}
      />
    </div>
  );
}
