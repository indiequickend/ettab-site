"use client";

import { useActionState, useEffect, useRef } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { changePasswordAction, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = {};

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(changePasswordAction, initialState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required />
        {state.fieldErrors?.currentPassword && (
          <p className="text-sm text-destructive">{state.fieldErrors.currentPassword[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">New password</Label>
        <Input id="newPassword" name="newPassword" type="password" required />
        {state.fieldErrors?.newPassword && (
          <p className="text-sm text-destructive">{state.fieldErrors.newPassword[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmNewPassword">Confirm new password</Label>
        <Input id="confirmNewPassword" name="confirmNewPassword" type="password" required />
        {state.fieldErrors?.confirmNewPassword && (
          <p className="text-sm text-destructive">{state.fieldErrors.confirmNewPassword[0]}</p>
        )}
      </div>

      {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}

      {state.success && (
        <Alert>
          <AlertDescription>Your password has been changed.</AlertDescription>
        </Alert>
      )}

      <SubmitButton label="Change password" pendingLabel="Changing..." className="w-full" />
    </form>
  );
}
