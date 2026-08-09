import Link from "next/link";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireMemberSession } from "@/lib/company-context";
import { searchByPlace } from "@/lib/search";
import { PlaceSearchInput } from "./place-search-input";
import { SearchResultCard } from "./search-result-card";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ placeId?: string }>;
}) {
  await requireMemberSession();
  const { placeId } = await searchParams;
  const { place, results } = placeId
    ? await searchByPlace(placeId)
    : { place: null, results: [] };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Find a member</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search for hoteliers, tour operators, and car vendors by place.
        </p>
        <Link href="/dashboard" className="mt-2 inline-block text-sm underline">
          Back to dashboard
        </Link>
      </div>

      <PlaceSearchInput initialPlace={place ?? undefined} />

      {placeId && !place && (
        <Card>
          <CardHeader>
            <CardTitle>No results for that place</CardTitle>
            <CardDescription>
              This place may have been removed. Try searching again.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {place && results.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No members found at {place.name} yet</CardTitle>
            <CardDescription>
              No properties or service areas are registered there yet.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {results.length > 0 && (
        <div className="grid gap-4">
          {results.map((result) => (
            <SearchResultCard key={result.companyId} result={result} />
          ))}
        </div>
      )}

      {!placeId && (
        <p className="text-sm text-muted-foreground">
          Search for a town, city, or region to see who in ETTAB covers it.
        </p>
      )}
    </div>
  );
}
