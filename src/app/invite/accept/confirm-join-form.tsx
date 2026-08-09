"use client";

import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { confirmJoinAction, type InviteActionState } from "./actions";

const initialState: InviteActionState = {};

export function ConfirmJoinForm({
  token,
  defaultName,
  defaultPhone,
}: {
  token: string;
  defaultName: string;
  defaultPhone: string;
}) {
  const [state, formAction] = useActionState(confirmJoinAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="personName">Your name</Label>
        <Input id="personName" name="personName" defaultValue={defaultName} required />
        {state.fieldErrors?.personName && (
          <p className="text-sm text-destructive">{state.fieldErrors.personName[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="personPhone">Phone</Label>
        <Input
          id="personPhone"
          name="personPhone"
          type="tel"
          defaultValue={defaultPhone}
          required
        />
        {state.fieldErrors?.personPhone && (
          <p className="text-sm text-destructive">{state.fieldErrors.personPhone[0]}</p>
        )}
      </div>

      {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}

      <SubmitButton label="Join company" pendingLabel="Joining..." className="w-full" />
    </form>
  );
}
