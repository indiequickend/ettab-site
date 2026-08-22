import { PhoneIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SearchResultCompany } from "@/lib/search";

const MEMBER_TYPE_LABELS: Record<string, string> = {
  hotelier: "Hotelier",
  tour_operator: "Tour Operator",
  car_vendor: "Car Vendor",
};

export function SearchResultCard({ result }: { result: SearchResultCompany }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{result.companyName}</CardTitle>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {result.memberTypes.map((memberType) => (
            <Badge key={memberType} variant="secondary">
              {MEMBER_TYPE_LABELS[memberType] ?? memberType}
            </Badge>
          ))}
          {result.servesArea && <Badge variant="outline">Serves this area</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {result.matchedProperties.length > 0 && (
          <div className="flex flex-col gap-3">
            {result.matchedProperties.map((property) => (
              <div key={property.id} className="rounded-lg bg-muted/40 p-3 text-sm">
                <p className="font-medium">{property.name}</p>
                <p className="text-muted-foreground">
                  {[
                    property.category,
                    property.totalRooms ? `${property.totalRooms} rooms` : null,
                    property.capacity ? `capacity ${property.capacity}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
                {(property.rateB2B || property.rateB2C) && (
                  <p className="text-muted-foreground">
                    {property.rateB2B ? `B2B: Rs. ${property.rateB2B}` : null}
                    {property.rateB2B && property.rateB2C ? " · " : null}
                    {property.rateB2C ? `B2C: Rs. ${property.rateB2C}` : null}
                  </p>
                )}
                {(property.googleBusinessLink || property.facebookLink || property.website) && (
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {property.googleBusinessLink && (
                      <a
                        href={property.googleBusinessLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        Google Business
                      </a>
                    )}
                    {property.facebookLink && (
                      <a
                        href={property.facebookLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        Facebook
                      </a>
                    )}
                    {property.website && (
                      <a
                        href={property.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        Website
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {result.matchedVehicles.length > 0 && (
          <div className="flex flex-col gap-3">
            {result.matchedVehicles.map((vehicle) => (
              <div key={vehicle.id} className="rounded-lg bg-muted/40 p-3 text-sm">
                <p className="font-medium">{vehicle.name}</p>
                <p className="text-muted-foreground">
                  {[vehicle.vehicleType, vehicle.capacity ? `${vehicle.capacity} seats` : null]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
                {(vehicle.rateB2B || vehicle.rateB2C) && (
                  <p className="text-muted-foreground">
                    {vehicle.rateB2B ? `B2B: Rs. ${vehicle.rateB2B}` : null}
                    {vehicle.rateB2B && vehicle.rateB2C ? " · " : null}
                    {vehicle.rateB2C ? `B2C: Rs. ${vehicle.rateB2C}` : null}
                  </p>
                )}
                {(vehicle.googleBusinessLink || vehicle.facebookLink || vehicle.website) && (
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {vehicle.googleBusinessLink && (
                      <a
                        href={vehicle.googleBusinessLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        Google Business
                      </a>
                    )}
                    {vehicle.facebookLink && (
                      <a
                        href={vehicle.facebookLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        Facebook
                      </a>
                    )}
                    {vehicle.website && (
                      <a
                        href={vehicle.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        Website
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {result.partners.map((partner) => (
            <a
              key={partner.id}
              href={`tel:${partner.phone}`}
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between")}
            >
              <span className="flex items-center gap-2">
                <PhoneIcon className="size-4" />
                {partner.name}
              </span>
              <span className="text-muted-foreground">{partner.phone}</span>
            </a>
          ))}
          {result.partners.length === 0 && (
            <p className="text-sm text-muted-foreground">No contact number on file.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
