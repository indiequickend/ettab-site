"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startAuthentication,
} from "@simplewebauthn/browser";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAccountStatus } from "@/lib/account-status";
import { RATE_LIMIT_ERROR_CODE, rateLimitMessage, statusRejectionMessage } from "@/lib/auth-messages";
import { FingerprintEnrollDialog } from "./fingerprint-enroll-dialog";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fingerprintSupported, setFingerprintSupported] = useState(false);
  const [fingerprintPending, setFingerprintPending] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function detect() {
      if (!browserSupportsWebAuthn()) return;
      const available = await platformAuthenticatorIsAvailable();
      if (!cancelled && available) {
        setFingerprintSupported(true);
      }
    }
    void detect();
    return () => {
      cancelled = true;
    };
  }, []);

  function goToDashboard() {
    router.push("/dashboard");
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");

      const account = await getAccountStatus(email);
      if (account.rateLimited) {
        setError(rateLimitMessage(account.retryAfter!));
        return;
      }
      if (!account.exists) {
        setError("Invalid email or password.");
        return;
      }
      if (account.status !== "approved") {
        setError(statusRejectionMessage(account.status!));
        return;
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result || result.error) {
        if (result?.error === RATE_LIMIT_ERROR_CODE) {
          setError(rateLimitMessage("15 minutes"));
        } else {
          setError("Invalid email or password.");
        }
        return;
      }

      if (fingerprintSupported) {
        try {
          const statusRes = await fetch("/api/webauthn/status");
          if (statusRes.ok) {
            const status = await statusRes.json();
            if (!status.hasCredential && !status.promptDismissed) {
              setShowEnrollDialog(true);
              return;
            }
          }
        } catch {
          // fall through to normal navigation
        }
      }

      goToDashboard();
    } finally {
      setPending(false);
    }
  }

  async function handleFingerprintLogin() {
    setError(null);
    setFingerprintPending(true);
    try {
      const optionsRes = await fetch("/api/webauthn/authentication/options", { method: "POST" });
      if (!optionsRes.ok) {
        setError("Fingerprint login is not available right now.");
        return;
      }
      const options = await optionsRes.json();

      let authResp;
      try {
        authResp = await startAuthentication({ optionsJSON: options });
      } catch {
        setError("Fingerprint login was cancelled.");
        return;
      }

      const result = await signIn("webauthn", {
        response: JSON.stringify(authResp),
        redirect: false,
      });
      if (!result || result.error) {
        if (result?.error === RATE_LIMIT_ERROR_CODE) {
          setError(rateLimitMessage("15 minutes"));
        } else {
          setError("Fingerprint login failed. Please use your password.");
        }
        return;
      }

      goToDashboard();
    } finally {
      setFingerprintPending(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Logging in..." : "Log in"}
        </Button>

        {fingerprintSupported && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={fingerprintPending}
            onClick={handleFingerprintLogin}
          >
            {fingerprintPending ? "Verifying..." : "Log in with fingerprint"}
          </Button>
        )}
      </form>

      <FingerprintEnrollDialog
        open={showEnrollDialog}
        onDone={() => {
          setShowEnrollDialog(false);
          goToDashboard();
        }}
      />
    </>
  );
}
