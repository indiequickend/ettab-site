"use client";

import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { createAccountAndJoinAction, type InviteActionState } from "./actions";

const initialState: InviteActionState = {};

export function CreateAccountAndJoinForm({
  token,
  defaultEmail,
}: {
  token: string;
  defaultEmail: string;
}) {
  const [state, formAction] = useActionState(createAccountAndJoinAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={defaultEmail} disabled readOnly />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" required />
        {state.fieldErrors?.phone && (
          <p className="text-sm text-destructive">{state.fieldErrors.phone[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
        {state.fieldErrors?.password && (
          <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required />
        {state.fieldErrors?.confirmPassword && (
          <p className="text-sm text-destructive">{state.fieldErrors.confirmPassword[0]}</p>
        )}
      </div>

      {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}

      <SubmitButton
        label="Create account & join"
        pendingLabel="Creating account..."
        className="w-full"
      />
    </form>
  );
}
