"use client";

import { useActionState } from "react";
import { XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { removeServiceAreaAction, type ServiceAreaActionState } from "./actions";

export interface ServiceAreaRow {
  id: string;
  place: { id: string; name: string; isState: boolean };
}

const initialState: ServiceAreaActionState = {};

function RemoveServiceAreaButton({ serviceAreaId }: { serviceAreaId: string }) {
  const [, formAction] = useActionState(removeServiceAreaAction, initialState);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="serviceAreaId" value={serviceAreaId} />
      <button
        type="submit"
        aria-label="Remove service area"
        className="ml-1 -mr-0.5 rounded-full p-0.5 hover:bg-foreground/10"
      >
        <XIcon className="size-3" />
      </button>
    </form>
  );
}

export function ServiceAreaBadges({ serviceAreas }: { serviceAreas: ServiceAreaRow[] }) {
  if (serviceAreas.length === 0) {
    return <p className="text-sm text-muted-foreground">No service areas added yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {serviceAreas.map((serviceArea) => (
        <Badge key={serviceArea.id} variant="secondary" className="h-7 px-3 text-sm">
          {serviceArea.place.name}
          {serviceArea.place.isState && (
            <span className="ml-1 text-xs text-muted-foreground">(state)</span>
          )}
          <RemoveServiceAreaButton serviceAreaId={serviceArea.id} />
        </Badge>
      ))}
    </div>
  );
}
