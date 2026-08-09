import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function InviteAcceptSuccessPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account created</CardTitle>
          <CardDescription>
            Your account has been created and linked to the company. You can log in now.
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
