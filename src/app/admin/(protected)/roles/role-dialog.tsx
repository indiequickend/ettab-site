"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PERMISSIONS, PERMISSION_LABELS, type Permission } from "@/lib/permission-constants";
import { createRoleAction, updateRoleAction, type RoleFormState } from "./actions";

const initialState: RoleFormState = {};

interface RoleDialogProps {
  role?: { id: string; name: string; permissions: string[]; isSystem: boolean };
}

export function RoleDialog({ role }: RoleDialogProps) {
  const [open, setOpen] = useState(false);
  const action = role ? updateRoleAction : createRoleAction;
  const [state, formAction] = useActionState(action, initialState);
  const isSuperadmin = role?.name === "superadmin";

  useEffect(() => {
    if (state !== initialState && !state.formError && !state.fieldErrors) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={role ? "outline" : "default"} size="sm" />}
      >
        {role ? "Edit" : "Create role"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role ? `Edit role: ${role.name}` : "Create role"}</DialogTitle>
          {isSuperadmin && (
            <DialogDescription>
              Superadmin has all permissions and cannot be changed.
            </DialogDescription>
          )}
        </DialogHeader>

        {isSuperadmin ? (
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary">*</Badge>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            {role && <input type="hidden" name="roleId" value={role.id} />}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={role?.name}
                disabled={role?.isSystem}
                required
              />
              {state.fieldErrors?.name && (
                <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Permissions</Label>
              <div className="flex flex-col gap-2">
                {PERMISSIONS.map((permission: Permission) => (
                  <label key={permission} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      name="permissions"
                      value={permission}
                      defaultChecked={role?.permissions.includes(permission)}
                    />
                    {PERMISSION_LABELS[permission]}
                  </label>
                ))}
              </div>
            </div>

            {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <SubmitButton label={role ? "Save" : "Create"} pendingLabel="Saving..." />
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
