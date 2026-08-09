import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Members Area — Coming Soon
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground sm:text-base">
        Registration, member search, and property listings for ETTAB
        hoteliers, tour operators, and car vendors are on the way.
      </p>
      <Button disabled>Register (coming soon)</Button>
    </main>
  );
}
