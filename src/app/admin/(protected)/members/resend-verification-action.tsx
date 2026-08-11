"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/submit-button";
import { resendVerificationEmailAction, type MemberDecisionState } from "./actions";

const initialState: MemberDecisionState = {};

export function ResendVerificationAction({ userId }: { userId: string }) {
  const [state, formAction] = useActionState(resendVerificationEmailAction, initialState);

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        <SubmitButton
          label="Resend verification email"
          pendingLabel="Sending..."
          size="sm"
          variant="outline"
        />
      </form>
      {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
    </div>
  );
}
