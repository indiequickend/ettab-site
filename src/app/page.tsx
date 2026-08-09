import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        ETTAB Member
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground sm:text-base">
        Find hoteliers, tour operators, and car vendors across Bengal. Member
        search and property listings are on the way.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/register" className={cn(buttonVariants())}>
          Register
        </Link>
        <Link href="/login" className={cn(buttonVariants({ variant: "outline" }))}>
          Already a member? Log in
        </Link>
      </div>
    </main>
  );
}
