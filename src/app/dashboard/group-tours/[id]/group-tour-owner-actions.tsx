"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { cn } from "@/lib/utils";
import { deleteGroupTourAction, toggleGroupTourFullAction, type GroupTourActionState } from "../actions";

const initialState: GroupTourActionState = {};

export function GroupTourOwnerActions({ tourId, isFull }: { tourId: string; isFull: boolean }) {
  const router = useRouter();
  const [toggleState, toggleAction] = useActionState(toggleGroupTourFullAction, initialState);
  const [deleteState, deleteFormAction] = useActionState(deleteGroupTourAction, initialState);

  useEffect(() => {
    if (deleteState !== initialState && !deleteState.formError) {
      router.push("/dashboard/group-tours");
    }
  }, [deleteState, router]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/dashboard/group-tours/${tourId}/edit`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Edit
        </Link>
        <form action={toggleAction}>
          <input type="hidden" name="groupTourId" value={tourId} />
          <input type="hidden" name="isFull" value={(!isFull).toString()} />
          <SubmitButton
            label={isFull ? "Mark available" : "Mark full"}
            pendingLabel="Updating..."
            variant="outline"
            size="sm"
          />
        </form>
        <form action={deleteFormAction}>
          <input type="hidden" name="groupTourId" value={tourId} />
          <SubmitButton label="Delete" pendingLabel="Deleting..." variant="destructive" size="sm" />
        </form>
      </div>
      {(toggleState.formError || deleteState.formError) && (
        <p className="text-sm text-destructive">
          {toggleState.formError || deleteState.formError}
        </p>
      )}
    </div>
  );
}
