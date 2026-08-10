"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { TourDescriptionEditor } from "@/components/tour-description-editor";
import {
  createGroupTourAction,
  updateGroupTourAction,
  type GroupTourActionState,
} from "./actions";

export interface GroupTourFormValues {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  durationLabel: string;
  totalSeats: number;
  bookedSeats: number;
  rateB2B: string | null;
  rateB2C: string | null;
  description: string;
}

const initialState: GroupTourActionState = {};

function toDateInputValue(value: string): string {
  return value ? value.slice(0, 10) : "";
}

export function GroupTourForm({
  mode,
  companyId,
  tour,
}: {
  mode: "create" | "edit";
  companyId: string;
  tour?: GroupTourFormValues;
}) {
  const router = useRouter();
  const action = mode === "create" ? createGroupTourAction : updateGroupTourAction;
  const [state, formAction] = useActionState(action, initialState);

  const [title, setTitle] = useState(() => tour?.title ?? "");
  const [startDate, setStartDate] = useState(() => (tour ? toDateInputValue(tour.startDate) : ""));
  const [endDate, setEndDate] = useState(() => (tour ? toDateInputValue(tour.endDate) : ""));
  const [durationLabel, setDurationLabel] = useState(() => tour?.durationLabel ?? "");
  const [totalSeats, setTotalSeats] = useState(() => tour?.totalSeats?.toString() ?? "");
  const [bookedSeats, setBookedSeats] = useState(() => (tour?.bookedSeats ?? 0).toString());
  const [rateB2B, setRateB2B] = useState(() => tour?.rateB2B ?? "");
  const [rateB2C, setRateB2C] = useState(() => tour?.rateB2C ?? "");

  useEffect(() => {
    if (state !== initialState && !state.formError && !state.fieldErrors) {
      router.push("/dashboard/group-tours");
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "create" ? (
        <input type="hidden" name="companyId" value={companyId} />
      ) : (
        <input type="hidden" name="groupTourId" value={tour!.id} />
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Tour title</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g. Shimla-Manali"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        {state.fieldErrors?.title && (
          <p className="text-sm text-destructive">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
          {state.fieldErrors?.startDate && (
            <p className="text-sm text-destructive">{state.fieldErrors.startDate[0]}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endDate">End date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            required
          />
          {state.fieldErrors?.endDate && (
            <p className="text-sm text-destructive">{state.fieldErrors.endDate[0]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="durationLabel">Duration</Label>
        <Input
          id="durationLabel"
          name="durationLabel"
          placeholder="e.g. 6D/5N"
          value={durationLabel}
          onChange={(event) => setDurationLabel(event.target.value)}
          required
        />
        {state.fieldErrors?.durationLabel && (
          <p className="text-sm text-destructive">{state.fieldErrors.durationLabel[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="totalSeats">Total seats</Label>
          <Input
            id="totalSeats"
            name="totalSeats"
            type="number"
            min={1}
            value={totalSeats}
            onChange={(event) => setTotalSeats(event.target.value)}
            required
          />
          {state.fieldErrors?.totalSeats && (
            <p className="text-sm text-destructive">{state.fieldErrors.totalSeats[0]}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bookedSeats">Booked seats</Label>
          <Input
            id="bookedSeats"
            name="bookedSeats"
            type="number"
            min={0}
            value={bookedSeats}
            onChange={(event) => setBookedSeats(event.target.value)}
          />
          {state.fieldErrors?.bookedSeats && (
            <p className="text-sm text-destructive">{state.fieldErrors.bookedSeats[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rateB2B">B2B rate (Rs.)</Label>
          <Input
            id="rateB2B"
            name="rateB2B"
            value={rateB2B}
            onChange={(event) => setRateB2B(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rateB2C">B2C rate (Rs.)</Label>
          <Input
            id="rateB2C"
            name="rateB2C"
            value={rateB2C}
            onChange={(event) => setRateB2C(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Description</Label>
        <TourDescriptionEditor defaultValue={tour?.description} />
        {state.fieldErrors?.description && (
          <p className="text-sm text-destructive">{state.fieldErrors.description[0]}</p>
        )}
      </div>

      {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <SubmitButton
          label={mode === "create" ? "Create tour" : "Save changes"}
          pendingLabel={mode === "create" ? "Creating..." : "Saving..."}
        />
      </div>
    </form>
  );
}
