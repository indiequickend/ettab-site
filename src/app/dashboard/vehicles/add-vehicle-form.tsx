"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlaceCombobox } from "@/components/place-combobox";
import { SubmitButton } from "@/components/submit-button";
import { createVehicleAction, type VehicleActionState } from "./actions";

const initialState: VehicleActionState = {};

export function AddVehicleForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createVehicleAction, initialState);

  useEffect(() => {
    if (state !== initialState && !state.formError && !state.fieldErrors) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Add vehicle</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add vehicle</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
          <input type="hidden" name="companyId" value={companyId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Vehicle name</Label>
            <Input id="name" name="name" placeholder="e.g. Innova Crysta" required />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Base location</Label>
            <PlaceCombobox />
            {state.fieldErrors?.placeName && (
              <p className="text-sm text-destructive">{state.fieldErrors.placeName[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vehicleType">Vehicle type</Label>
            <Input id="vehicleType" name="vehicleType" placeholder="e.g. Sedan, SUV, Tempo Traveller" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="capacity">Capacity (seats)</Label>
            <Input id="capacity" name="capacity" type="number" min={0} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rateB2B">B2B rate (Rs.)</Label>
              <Input id="rateB2B" name="rateB2B" placeholder="e.g. 1200-1400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rateB2C">B2C rate (Rs.)</Label>
              <Input id="rateB2C" name="rateB2C" placeholder="e.g. 1500" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="photoLinks">Photo links</Label>
            <Textarea
              id="photoLinks"
              name="photoLinks"
              placeholder="One Google Photos/Maps link per line"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="googleBusinessLink">Google Business page</Label>
            <Input id="googleBusinessLink" name="googleBusinessLink" type="url" />
            {state.fieldErrors?.googleBusinessLink && (
              <p className="text-sm text-destructive">{state.fieldErrors.googleBusinessLink[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="facebookLink">Facebook page</Label>
            <Input id="facebookLink" name="facebookLink" type="url" />
            {state.fieldErrors?.facebookLink && (
              <p className="text-sm text-destructive">{state.fieldErrors.facebookLink[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" type="url" />
            {state.fieldErrors?.website && (
              <p className="text-sm text-destructive">{state.fieldErrors.website[0]}</p>
            )}
          </div>

          {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton label="Add vehicle" pendingLabel="Adding..." />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
