"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTopLoader } from "nextjs-toploader";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAccountStatus } from "@/lib/account-status";
import { RATE_LIMIT_ERROR_CODE, rateLimitMessage, statusRejectionMessage } from "@/lib/auth-messages";

export function LoginForm() {
  const router = useRouter();
  const topLoader = useTopLoader();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    topLoader.start();

    try {
      const formData = new FormData(event.currentTarget);
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");

      const account = await getAccountStatus(email);
      if (account.rateLimited) {
        setError(rateLimitMessage(account.retryAfter!));
        topLoader.done();
        return;
      }
      if (!account.exists) {
        setError("Invalid email or password.");
        topLoader.done();
        return;
      }
      if (account.status !== "approved") {
        setError(statusRejectionMessage(account.status!));
        topLoader.done();
        return;
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result || result.error) {
        if (result?.error === RATE_LIMIT_ERROR_CODE) {
          setError(rateLimitMessage("15 minutes"));
        } else {
          setError("Invalid email or password.");
        }
        topLoader.done();
        return;
      }

      // Navigation takes over the progress bar from here; it completes on route change.
      router.push("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
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
    </form>
  );
}
