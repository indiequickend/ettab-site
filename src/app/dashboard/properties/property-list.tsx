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
import { deletePropertyAction, updatePropertyAction, type PropertyActionState } from "./actions";

export interface PropertyRow {
  id: string;
  name: string;
  place: { id: string; name: string; isState: boolean };
  category: string | null;
  totalRooms: number | null;
  capacity: number | null;
  rateB2B: string | null;
  rateB2C: string | null;
  photoLinks: string[];
  googleBusinessLink: string | null;
  facebookLink: string | null;
  website: string | null;
}

const initialState: PropertyActionState = {};

function EditPropertyDialog({ property }: { property: PropertyRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updatePropertyAction, initialState);

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
          <DialogTitle>Edit property</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
          <input type="hidden" name="propertyId" value={property.id} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`name-${property.id}`}>Property name</Label>
            <Input id={`name-${property.id}`} name="name" defaultValue={property.name} required />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Location</Label>
            <PlaceCombobox defaultValue={property.place} />
            {state.fieldErrors?.placeName && (
              <p className="text-sm text-destructive">{state.fieldErrors.placeName[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`category-${property.id}`}>Category</Label>
            <Input
              id={`category-${property.id}`}
              name="category"
              defaultValue={property.category ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`totalRooms-${property.id}`}>Total rooms</Label>
              <Input
                id={`totalRooms-${property.id}`}
                name="totalRooms"
                type="number"
                min={0}
                defaultValue={property.totalRooms ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`capacity-${property.id}`}>Capacity</Label>
              <Input
                id={`capacity-${property.id}`}
                name="capacity"
                type="number"
                min={0}
                defaultValue={property.capacity ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`rateB2B-${property.id}`}>B2B rate (Rs.)</Label>
              <Input
                id={`rateB2B-${property.id}`}
                name="rateB2B"
                defaultValue={property.rateB2B ?? ""}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`rateB2C-${property.id}`}>B2C rate (Rs.)</Label>
              <Input
                id={`rateB2C-${property.id}`}
                name="rateB2C"
                defaultValue={property.rateB2C ?? ""}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`photoLinks-${property.id}`}>Photo links</Label>
            <Textarea
              id={`photoLinks-${property.id}`}
              name="photoLinks"
              defaultValue={property.photoLinks.join("\n")}
              placeholder="One Google Photos/Maps link per line"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`googleBusinessLink-${property.id}`}>Google Business page</Label>
            <Input
              id={`googleBusinessLink-${property.id}`}
              name="googleBusinessLink"
              type="url"
              defaultValue={property.googleBusinessLink ?? ""}
            />
            {state.fieldErrors?.googleBusinessLink && (
              <p className="text-sm text-destructive">{state.fieldErrors.googleBusinessLink[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`facebookLink-${property.id}`}>Facebook page</Label>
            <Input
              id={`facebookLink-${property.id}`}
              name="facebookLink"
              type="url"
              defaultValue={property.facebookLink ?? ""}
            />
            {state.fieldErrors?.facebookLink && (
              <p className="text-sm text-destructive">{state.fieldErrors.facebookLink[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`website-${property.id}`}>Website</Label>
            <Input
              id={`website-${property.id}`}
              name="website"
              type="url"
              defaultValue={property.website ?? ""}
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

function DeletePropertyButton({ propertyId }: { propertyId: string }) {
  const [state, formAction] = useActionState(deletePropertyAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="propertyId" value={propertyId} />
      <SubmitButton label="Delete" pendingLabel="Deleting..." variant="destructive" size="sm" />
      {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
    </form>
  );
}

export function PropertyList({ properties }: { properties: PropertyRow[] }) {
  if (properties.length === 0) {
    return <p className="text-sm text-muted-foreground">No properties added yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Rooms</TableHead>
            <TableHead>B2B / B2C</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((property) => (
            <TableRow key={property.id}>
              <TableCell>{property.name}</TableCell>
              <TableCell>{property.place.name}</TableCell>
              <TableCell>{property.category ?? "—"}</TableCell>
              <TableCell>{property.totalRooms ?? "—"}</TableCell>
              <TableCell>
                {property.rateB2B ?? "—"} / {property.rateB2C ?? "—"}
              </TableCell>
              <TableCell className="flex justify-end gap-2 text-right">
                <EditPropertyDialog property={property} />
                <DeletePropertyButton propertyId={property.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
