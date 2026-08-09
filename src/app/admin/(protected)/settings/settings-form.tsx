"use client";

import { useState, useTransition } from "react";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateAutoVerificationAction } from "./actions";

export function SettingsForm({ initialAutoVerification }: { initialAutoVerification: boolean }) {
  const [autoVerification, setAutoVerification] = useState(initialAutoVerification);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setError(null);
    const previous = autoVerification;
    setAutoVerification(next);
    startTransition(async () => {
      const result = await updateAutoVerificationAction(next);
      if (!result.ok) {
        setAutoVerification(previous);
        setError(result.error ?? "Failed to update settings.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Switch
          id="autoVerification"
          checked={autoVerification}
          disabled={pending}
          onCheckedChange={handleChange}
        />
        <Label htmlFor="autoVerification">Auto-approve verified members</Label>
      </div>
      <p className="text-sm text-muted-foreground">
        When enabled, verified members skip admin approval and are activated immediately.
      </p>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
