import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
          <CardDescription>The page you&apos;re looking for doesn&apos;t exist.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/" className={cn(buttonVariants(), "w-full")}>
            Back home
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
