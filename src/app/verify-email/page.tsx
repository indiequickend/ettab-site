import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const success = status === "success";

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{success ? "Email verified" : "Verification link invalid"}</CardTitle>
          <CardDescription>
            {success
              ? "Your email has been verified. An ETTAB admin will review your registration next - you'll be able to log in once approved."
              : "This verification link is invalid or has expired. Please register again or contact ETTAB admin."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Go to login
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
