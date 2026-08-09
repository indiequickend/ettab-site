"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { deleteRoleAction, type RoleFormState } from "./actions";

const initialState: RoleFormState = {};

export function DeleteRoleButton({ roleId, isSystem }: { roleId: string; isSystem: boolean }) {
  const [state, formAction] = useActionState(deleteRoleAction, initialState);

  if (isSystem) {
    return (
      <span className="text-sm text-muted-foreground" title="System roles cannot be deleted.">
        Delete
      </span>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="roleId" value={roleId} />
      <SubmitButton label="Delete" pendingLabel="Deleting..." variant="destructive" size="sm" />
      {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
    </form>
  );
}
