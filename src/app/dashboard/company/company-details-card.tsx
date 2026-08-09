"use client";

import { useActionState, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import type { MemberType } from "@/models";
import type { PlainCompany } from "@/lib/company-context";
import { updateCompanyDetailsAction, type CompanyActionState } from "./actions";

const MEMBER_TYPES = [
  { value: "hotelier", label: "Hotelier" },
  { value: "tour_operator", label: "Tour Operator" },
  { value: "car_vendor", label: "Car Vendor" },
];

const initialState: CompanyActionState = {};

export function CompanyDetailsCard({ company }: { company: PlainCompany }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updateCompanyDetailsAction, initialState);

  useEffect(() => {
    if (state !== initialState && !state.formError && !state.fieldErrors) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{company.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1">
          {company.memberTypes.length > 0 ? (
            company.memberTypes.map((type) => (
              <Badge key={type} variant="secondary">
                {type}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No member types set</span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Licence / MSME numbers:{" "}
          {company.licenceNumbers.length > 0 ? company.licenceNumbers.join(", ") : "—"}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm" className="self-start" />}>
            Edit company details
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit company details</DialogTitle>
            </DialogHeader>
            <form action={formAction} className="flex flex-col gap-4">
              <input type="hidden" name="companyId" value={company.id} />

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Company name</Label>
                <Input id="name" name="name" defaultValue={company.name} required />
                {state.fieldErrors?.name && (
                  <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label>Member type</Label>
                <div className="flex flex-col gap-2">
                  {MEMBER_TYPES.map((type) => (
                    <label key={type.value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        name="memberTypes"
                        value={type.value}
                        defaultChecked={company.memberTypes.includes(type.value as MemberType)}
                      />
                      {type.label}
                    </label>
                  ))}
                </div>
                {state.fieldErrors?.memberTypes && (
                  <p className="text-sm text-destructive">{state.fieldErrors.memberTypes[0]}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="licenceNumbers">Trade licence / MSME number(s)</Label>
                <Input
                  id="licenceNumbers"
                  name="licenceNumbers"
                  defaultValue={company.licenceNumbers.join(", ")}
                  placeholder="Comma-separated if multiple"
                />
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
      </CardContent>
    </Card>
  );
}
