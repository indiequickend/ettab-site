"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            This admin page failed to load. Try again, or check the server logs if the problem
            persists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => reset()} className="w-full">
            Try again
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
