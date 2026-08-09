"use client";

import { useActionState, useEffect, useRef } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { invitePartnerAction, type CompanyActionState } from "./actions";

const initialState: CompanyActionState = {};

export function InvitePartnerForm({ companyId }: { companyId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(invitePartnerAction, initialState);

  useEffect(() => {
    if (state !== initialState && !state.formError && !state.fieldErrors) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="companyId" value={companyId} />
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="invite-email">Partner&apos;s email</Label>
        <Input id="invite-email" name="email" type="email" required />
        {state.fieldErrors?.email && (
          <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
        )}
        {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
      </div>
      <SubmitButton label="Send invite" pendingLabel="Sending..." />
    </form>
  );
}
