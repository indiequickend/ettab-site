"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { GroupTourCardData } from "@/lib/group-tours";
import { GroupTourCard } from "./group-tour-card";
import { loadMoreGroupToursAction } from "./group-tours-search-action";

export function GroupToursFeed({
  initialQuery,
  initialTours,
  initialHasMore,
}: {
  initialQuery: string;
  initialTours: GroupTourCardData[];
  initialHasMore: boolean;
}) {
  const router = useRouter();
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [tours, setTours] = useState(initialTours);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = queryInput.trim();
      const target = trimmed ? `/dashboard?q=${encodeURIComponent(trimmed)}` : "/dashboard";
      router.push(target);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setLoading((currentlyLoading) => {
            if (currentlyLoading) return currentlyLoading;
            loadMoreGroupToursAction(initialQuery, tours.length).then((result) => {
              setTours((current) => [...current, ...result.tours]);
              setHasMore(result.hasMore);
              setLoading(false);
            });
            return true;
          });
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, initialQuery, tours.length]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          placeholder="Search by tour title or agency name..."
          className="pl-8"
        />
      </div>

      {tours.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {initialQuery
            ? `No group tours match "${initialQuery}".`
            : "No upcoming group tours right now."}
        </p>
      ) : (
        <div className="max-h-[65vh] overflow-y-auto p-1">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour) => (
              <GroupTourCard key={tour.id} tour={tour} />
            ))}
          </div>

          {hasMore && (
            <div ref={sentinelRef} className="pt-4">
              {loading && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Skeleton className="h-40 w-full" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
