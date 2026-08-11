"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function FingerprintEnrollDialog({
  open,
  onDone,
}: {
  open: boolean;
  onDone: () => void;
}) {
  const [dontRemind, setDontRemind] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function savePreferenceIfNeeded() {
    if (!dontRemind) return;
    try {
      await fetch("/api/webauthn/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissed: true }),
      });
    } catch {
      // best-effort only
    }
  }

  async function handleAccept() {
    setPending(true);
    setError(null);
    try {
      const optionsRes = await fetch("/api/webauthn/registration/options", { method: "POST" });
      if (!optionsRes.ok) {
        setError("Could not start fingerprint setup. Please try again.");
        return;
      }
      const options = await optionsRes.json();

      const attResp = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/webauthn/registration/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: attResp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) {
        setError("Fingerprint setup failed. Please try again.");
        return;
      }

      await savePreferenceIfNeeded();
      onDone();
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      setError(
        name === "NotAllowedError"
          ? "Fingerprint setup was cancelled."
          : "Fingerprint setup failed. Please try again."
      );
    } finally {
      setPending(false);
    }
  }

  async function handleDecline() {
    setPending(true);
    try {
      await savePreferenceIfNeeded();
    } finally {
      setPending(false);
      onDone();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) {
          void handleDecline();
        }
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Enable fingerprint login?</DialogTitle>
          <DialogDescription>
            Use your device&apos;s fingerprint, face unlock, or Windows Hello to log in faster next
            time.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Checkbox
            id="fingerprint-dont-remind"
            checked={dontRemind}
            onCheckedChange={(checked) => setDontRemind(checked)}
          />
          <Label htmlFor="fingerprint-dont-remind" className="text-sm font-normal">
            Do not remind me again!
          </Label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={handleDecline}>
            Not now
          </Button>
          <Button type="button" disabled={pending} onClick={handleAccept}>
            {pending ? "Setting up..." : "Enable fingerprint login"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
