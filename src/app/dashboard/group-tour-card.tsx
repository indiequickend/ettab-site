import Link from "next/link";
import { CalendarIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GroupTourCardData } from "@/lib/group-tours";

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function GroupTourCard({ tour }: { tour: GroupTourCardData }) {
  const lowSeats = tour.seatsLeft <= 5;

  return (
    <Link href={`/dashboard/group-tours/${tour.id}`} className="block">
      <Card className="h-full transition-colors hover:bg-muted/40">
        <CardHeader>
          <CardTitle>{tour.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{tour.companyName}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="secondary">{tour.durationLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Badge
            variant="outline"
            className="h-7 w-fit gap-1 border-transparent bg-green-100 px-2.5 text-sm font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300"
          >
            <CalendarIcon data-icon="inline-start" />
            {formatDate(tour.startDate)} – {formatDate(tour.endDate)}
          </Badge>
          {(tour.rateB2B || tour.rateB2C) && (
            <p className="text-sm text-muted-foreground">
              {tour.rateB2B ? `B2B: Rs. ${tour.rateB2B}` : null}
              {tour.rateB2B && tour.rateB2C ? " · " : null}
              {tour.rateB2C ? `B2C: Rs. ${tour.rateB2C}` : null}
            </p>
          )}
          <p className={cn("text-sm font-medium", lowSeats && "text-destructive")}>
            {tour.seatsLeft} seats left
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
