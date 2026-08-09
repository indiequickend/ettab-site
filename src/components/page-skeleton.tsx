import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex w-full flex-col gap-4 px-4 py-8 sm:px-6">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="flex flex-col gap-3 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
