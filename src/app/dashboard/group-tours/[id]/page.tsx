import DOMPurify from "isomorphic-dompurify";
import { PhoneIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getActiveCompany, requireMemberSession } from "@/lib/company-context";
import { getGroupTourDetail } from "@/lib/group-tours";
import { GroupTourOwnerActions } from "./group-tour-owner-actions";

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function GroupTourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireMemberSession();
  const { id } = await params;
  const active = await getActiveCompany(session.user.id!);
  const tour = await getGroupTourDetail(id, active?.company.id ?? null);

  if (!tour) {
    notFound();
  }

  const isPast = tour.startDate < new Date();
  if (!tour.isOwner && (isPast || tour.isFull)) {
    notFound();
  }

  const safeDescription = DOMPurify.sanitize(tour.description, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "b",
      "i",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "a",
      "h1",
      "h2",
      "h3",
      "blockquote",
      "code",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/dashboard" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>

      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tour.title}</h1>
          <div className="flex gap-1.5">
            <Badge variant="secondary">{tour.durationLabel}</Badge>
            {tour.isFull && <Badge variant="outline">Full</Badge>}
            {isPast && <Badge variant="outline">Past</Badge>}
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{tour.companyName}</p>
      </div>

      {tour.isOwner && <GroupTourOwnerActions tourId={tour.id} isFull={tour.isFull} />}

      <Card>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm">
            <span className="font-medium">Dates: </span>
            {formatDate(tour.startDate)} – {formatDate(tour.endDate)}
          </p>
          <p className="text-sm">
            <span className="font-medium">Seats: </span>
            {tour.bookedSeats}/{tour.totalSeats} booked · {tour.seatsLeft} left
          </p>
          {(tour.rateB2B || tour.rateB2C) && (
            <p className="text-sm">
              <span className="font-medium">Rates: </span>
              {tour.rateB2B ? `B2B: Rs. ${tour.rateB2B}` : null}
              {tour.rateB2B && tour.rateB2C ? " · " : null}
              {tour.rateB2C ? `B2C: Rs. ${tour.rateB2C}` : null}
            </p>
          )}
        </CardContent>
      </Card>

      {safeDescription && (
        <Card>
          <CardHeader>
            <CardTitle>About this tour</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="flex flex-col gap-2 text-sm [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: safeDescription }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contact {tour.companyName}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {tour.contacts.map((contact) => (
            <a
              key={contact.id}
              href={`tel:${contact.phone}`}
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between")}
            >
              <span className="flex items-center gap-2">
                <PhoneIcon className="size-4" />
                {contact.name}
              </span>
              <span className="text-muted-foreground">{contact.phone}</span>
            </a>
          ))}
          {tour.contacts.length === 0 && (
            <p className="text-sm text-muted-foreground">No contact number on file.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
