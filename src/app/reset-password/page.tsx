import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { connectToDatabase } from "@/lib/mongodb";
import { hashToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { User } from "@/models";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset link invalid</CardTitle>
            <CardDescription>This password reset link is missing a token.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              Request a new link
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  await connectToDatabase();
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetTokenExpiresAt: { $gt: new Date() },
  })
    .select("_id")
    .lean();

  if (!user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset link invalid</CardTitle>
            <CardDescription>
              This password reset link is invalid, has expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/forgot-password" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
              Request a new link
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Choose a new password for your ETTAB Member account.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm token={token} />
        </CardContent>
      </Card>
    </main>
  );
}
