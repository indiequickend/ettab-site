"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateUserRolesAction, type RoleFormState } from "./actions";

const initialState: RoleFormState = {};

interface AssignRolesDialogProps {
  user: { id: string; name: string; roleIds: string[] };
  roles: { id: string; name: string }[];
}

export function AssignRolesDialog({ user, roles }: AssignRolesDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updateUserRolesAction, initialState);

  useEffect(() => {
    if (state !== initialState && !state.formError) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Edit roles</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit roles: {user.name}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="userId" value={user.id} />
          <div className="flex flex-col gap-2">
            <Label>Roles</Label>
            <div className="flex flex-col gap-2">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    name="roleIds"
                    value={role.id}
                    defaultChecked={user.roleIds.includes(role.id)}
                  />
                  {role.name}
                </label>
              ))}
            </div>
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
