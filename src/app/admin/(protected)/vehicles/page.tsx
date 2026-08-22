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
import { Vehicle } from "@/models";
import type { ICompany, IPlace } from "@/models";

const PAGE_SIZE = 20;

function parsePage(value: string | undefined, totalPages: number): number {
  const parsed = value ? parseInt(value, 10) : 1;
  const safe = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  return Math.min(safe, totalPages);
}

export default async function AdminVehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePermission("vehicles.view");
  await connectToDatabase();

  const sp = await searchParams;
  const totalVehicles = await Vehicle.countDocuments();
  const totalPages = Math.max(1, Math.ceil(totalVehicles / PAGE_SIZE));
  const page = parsePage(sp.page, totalPages);

  const vehicles = await Vehicle.find()
    .sort({ name: 1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate<{ companyId: ICompany }>("companyId")
    .populate<{ placeId: IPlace }>("placeId")
    .lean();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Vehicles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every vehicle listed across all car vendor companies.
        </p>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No vehicles yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Base location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>B2B / B2C</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle._id.toString()}>
                  <TableCell>{vehicle.name}</TableCell>
                  <TableCell>{vehicle.companyId?.name ?? "—"}</TableCell>
                  <TableCell>{vehicle.placeId?.name ?? "—"}</TableCell>
                  <TableCell>{vehicle.vehicleType ?? "—"}</TableCell>
                  <TableCell>{vehicle.capacity ?? "—"}</TableCell>
                  <TableCell>
                    {vehicle.rateB2B ?? "—"} / {vehicle.rateB2C ?? "—"}
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
        hrefFor={(nextPage) => (nextPage > 1 ? `/admin/vehicles?page=${nextPage}` : "/admin/vehicles")}
      />
    </div>
  );
}
