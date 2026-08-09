"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = {};

const MEMBER_TYPES = [
  { value: "hotelier", label: "Hotelier" },
  { value: "tour_operator", label: "Tour Operator" },
  { value: "car_vendor", label: "Car Vendor" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating account..." : "Create account"}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
        {state.fieldErrors?.email && (
          <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="companyName">Company name</Label>
        <Input id="companyName" name="companyName" required />
        {state.fieldErrors?.companyName && (
          <p className="text-sm text-destructive">{state.fieldErrors.companyName[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Member type</Label>
        <div className="flex flex-col gap-2">
          {MEMBER_TYPES.map((type) => (
            <label key={type.value} className="flex items-center gap-2 text-sm">
              <Checkbox name="memberTypes" value={type.value} />
              {type.label}
            </label>
          ))}
        </div>
        {state.fieldErrors?.memberTypes && (
          <p className="text-sm text-destructive">{state.fieldErrors.memberTypes[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="licenceNumbers">Trade licence / MSME number(s) (optional)</Label>
        <Input id="licenceNumbers" name="licenceNumbers" placeholder="Comma-separated if multiple" />
      </div>

      {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}

      <SubmitButton />
    </form>
  );
}
