import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationLinks } from "@/components/admin/pagination-links";
import { connectToDatabase } from "@/lib/mongodb";
import { requirePermission } from "@/lib/permissions";
import { Property } from "@/models";
import type { ICompany, IPlace } from "@/models";

const PAGE_SIZE = 20;

function parsePage(value: string | undefined, totalPages: number): number {
  const parsed = value ? parseInt(value, 10) : 1;
  const safe = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  return Math.min(safe, totalPages);
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePermission("properties.view");
  await connectToDatabase();

  const sp = await searchParams;
  const totalProperties = await Property.countDocuments();
  const totalPages = Math.max(1, Math.ceil(totalProperties / PAGE_SIZE));
  const page = parsePage(sp.page, totalPages);

  const properties = await Property.find()
    .sort({ name: 1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate<{ companyId: ICompany }>("companyId")
    .populate<{ placeId: IPlace }>("placeId")
    .lean();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Properties</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every hotel/homestay property listed across all companies.
        </p>
      </div>

      {properties.length === 0 ? (
        <p className="text-sm text-muted-foreground">No properties yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead>B2B / B2C</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property._id.toString()}>
                  <TableCell>{property.name}</TableCell>
                  <TableCell>{property.companyId?.name ?? "—"}</TableCell>
                  <TableCell>{property.placeId?.name ?? "—"}</TableCell>
                  <TableCell>{property.category ?? "—"}</TableCell>
                  <TableCell>{property.totalRooms ?? "—"}</TableCell>
                  <TableCell>
                    {property.rateB2B ?? "—"} / {property.rateB2C ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <PaginationLinks
        page={page}
        totalPages={totalPages}
        hrefFor={(nextPage) => (nextPage > 1 ? `/admin/properties?page=${nextPage}` : "/admin/properties")}
      />
    </div>
  );
}
