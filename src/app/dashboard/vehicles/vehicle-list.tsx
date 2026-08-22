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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteVehicleAction, updateVehicleAction, type VehicleActionState } from "./actions";

export interface VehicleRow {
  id: string;
  name: string;
  place: { id: string; name: string; isState: boolean };
  vehicleType: string | null;
  capacity: number | null;
  rateB2B: string | null;
  rateB2C: string | null;
  photoLinks: string[];
  googleBusinessLink: string | null;
  facebookLink: string | null;
  website: string | null;
}

const initialState: VehicleActionState = {};

function EditVehicleDialog({ vehicle }: { vehicle: VehicleRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updateVehicleAction, initialState);

  useEffect(() => {
    if (state !== initialState && !state.formError && !state.fieldErrors) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Edit</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit vehicle</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
          <input type="hidden" name="vehicleId" value={vehicle.id} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`name-${vehicle.id}`}>Vehicle name</Label>
            <Input id={`name-${vehicle.id}`} name="name" defaultValue={vehicle.name} required />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Base location</Label>
            <PlaceCombobox defaultValue={vehicle.place} />
            {state.fieldErrors?.placeName && (
              <p className="text-sm text-destructive">{state.fieldErrors.placeName[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`vehicleType-${vehicle.id}`}>Vehicle type</Label>
            <Input
              id={`vehicleType-${vehicle.id}`}
              name="vehicleType"
              defaultValue={vehicle.vehicleType ?? ""}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`capacity-${vehicle.id}`}>Capacity (seats)</Label>
            <Input
              id={`capacity-${vehicle.id}`}
              name="capacity"
              type="number"
              min={0}
              defaultValue={vehicle.capacity ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`rateB2B-${vehicle.id}`}>B2B rate (Rs.)</Label>
              <Input
                id={`rateB2B-${vehicle.id}`}
                name="rateB2B"
                defaultValue={vehicle.rateB2B ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`rateB2C-${vehicle.id}`}>B2C rate (Rs.)</Label>
              <Input
                id={`rateB2C-${vehicle.id}`}
                name="rateB2C"
                defaultValue={vehicle.rateB2C ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`photoLinks-${vehicle.id}`}>Photo links</Label>
            <Textarea
              id={`photoLinks-${vehicle.id}`}
              name="photoLinks"
              defaultValue={vehicle.photoLinks.join("\n")}
              placeholder="One Google Photos/Maps link per line"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`googleBusinessLink-${vehicle.id}`}>Google Business page</Label>
            <Input
              id={`googleBusinessLink-${vehicle.id}`}
              name="googleBusinessLink"
              type="url"
              defaultValue={vehicle.googleBusinessLink ?? ""}
            />
            {state.fieldErrors?.googleBusinessLink && (
              <p className="text-sm text-destructive">{state.fieldErrors.googleBusinessLink[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`facebookLink-${vehicle.id}`}>Facebook page</Label>
            <Input
              id={`facebookLink-${vehicle.id}`}
              name="facebookLink"
              type="url"
              defaultValue={vehicle.facebookLink ?? ""}
            />
            {state.fieldErrors?.facebookLink && (
              <p className="text-sm text-destructive">{state.fieldErrors.facebookLink[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`website-${vehicle.id}`}>Website</Label>
            <Input
              id={`website-${vehicle.id}`}
              name="website"
              type="url"
              defaultValue={vehicle.website ?? ""}
            />
            {state.fieldErrors?.website && (
              <p className="text-sm text-destructive">{state.fieldErrors.website[0]}</p>
            )}
          </div>

          {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton label="Save" pendingLabel="Saving..." />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteVehicleButton({ vehicleId }: { vehicleId: string }) {
  const [state, formAction] = useActionState(deleteVehicleAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      <SubmitButton label="Delete" pendingLabel="Deleting..." variant="destructive" size="sm" />
      {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
    </form>
  );
}

export function VehicleList({ vehicles }: { vehicles: VehicleRow[] }) {
  if (vehicles.length === 0) {
    return <p className="text-sm text-muted-foreground">No vehicles added yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Base location</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>B2B / B2C</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell>{vehicle.name}</TableCell>
              <TableCell>{vehicle.place.name}</TableCell>
              <TableCell>{vehicle.vehicleType ?? "—"}</TableCell>
              <TableCell>{vehicle.capacity ?? "—"}</TableCell>
              <TableCell>
                {vehicle.rateB2B ?? "—"} / {vehicle.rateB2C ?? "—"}
              </TableCell>
              <TableCell className="flex justify-end gap-2 text-right">
                <EditVehicleDialog vehicle={vehicle} />
                <DeleteVehicleButton vehicleId={vehicle.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
