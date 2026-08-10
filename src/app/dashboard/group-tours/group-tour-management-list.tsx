"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { cn } from "@/lib/utils";
import type { ManagedGroupTour } from "@/lib/group-tours";
import {
  deleteGroupTourAction,
  toggleGroupTourFullAction,
  type GroupTourActionState,
} from "./actions";

const initialState: GroupTourActionState = {};

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ToggleFullButton({ tourId, isFull }: { tourId: string; isFull: boolean }) {
  const [, formAction] = useActionState(toggleGroupTourFullAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="groupTourId" value={tourId} />
      <input type="hidden" name="isFull" value={(!isFull).toString()} />
      <SubmitButton
        label={isFull ? "Mark available" : "Mark full"}
        pendingLabel="Updating..."
        variant="outline"
        size="sm"
      />
    </form>
  );
}

function DeleteTourButton({ tourId }: { tourId: string }) {
  const [state, formAction] = useActionState(deleteGroupTourAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="groupTourId" value={tourId} />
      <SubmitButton label="Delete" pendingLabel="Deleting..." variant="destructive" size="sm" />
      {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
    </form>
  );
}

export function GroupTourManagementList({ tours }: { tours: ManagedGroupTour[] }) {
  if (tours.length === 0) {
    return <p className="text-sm text-muted-foreground">No group tours added yet.</p>;
  }

  const now = new Date();

  return (
    <div className="flex flex-col gap-4">
      {tours.map((tour) => {
        const isPast = new Date(tour.startDate) < now;
        return (
          <Card key={tour.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle>{tour.title}</CardTitle>
                <div className="flex shrink-0 gap-1.5">
                  {tour.isFull && <Badge variant="outline">Full</Badge>}
                  {isPast && <Badge variant="outline">Past</Badge>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(tour.startDate)} – {formatDate(tour.endDate)} · {tour.durationLabel}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {tour.bookedSeats}/{tour.totalSeats} seats booked · {tour.seatsLeft} left
              </p>
              {(tour.rateB2B || tour.rateB2C) && (
                <p className="text-sm text-muted-foreground">
                  {tour.rateB2B ? `B2B: Rs. ${tour.rateB2B}` : null}
                  {tour.rateB2B && tour.rateB2C ? " · " : null}
                  {tour.rateB2C ? `B2C: Rs. ${tour.rateB2C}` : null}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Link
                  href={`/dashboard/group-tours/${tour.id}/edit`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Edit
                </Link>
                <ToggleFullButton tourId={tour.id} isFull={tour.isFull} />
                <DeleteTourButton tourId={tour.id} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
