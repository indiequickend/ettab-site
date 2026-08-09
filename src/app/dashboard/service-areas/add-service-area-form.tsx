"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { PlaceCombobox } from "@/components/place-combobox";
import { SubmitButton } from "@/components/submit-button";
import { addServiceAreaAction, type ServiceAreaActionState } from "./actions";

const initialState: ServiceAreaActionState = {};

export function AddServiceAreaForm({ companyId }: { companyId: string }) {
  const [state, formAction] = useActionState(addServiceAreaAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [comboboxKey, setComboboxKey] = useState(0);

  useEffect(() => {
    if (state !== initialState && !state.formError && !state.fieldErrors) {
      setComboboxKey((key) => key + 1);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <input type="hidden" name="companyId" value={companyId} />
      <div className="flex-1">
        <PlaceCombobox key={comboboxKey} />
        {(state.fieldErrors?.placeName || state.formError) && (
          <p className="mt-1 text-sm text-destructive">
            {state.fieldErrors?.placeName?.[0] ?? state.formError}
          </p>
        )}
      </div>
      <SubmitButton label="Add service area" pendingLabel="Adding..." />
    </form>
  );
}
