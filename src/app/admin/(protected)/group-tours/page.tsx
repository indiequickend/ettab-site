import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PaginationLinks } from "@/components/admin/pagination-links";
import { connectToDatabase } from "@/lib/mongodb";
import { requirePermission } from "@/lib/permissions";
import { GroupTour } from "@/models";
import type { ICompany } from "@/models";

const PAGE_SIZE = 20;

function parsePage(value: string | undefined, totalPages: number): number {
  const parsed = value ? parseInt(value, 10) : 1;
  const safe = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  return Math.min(safe, totalPages);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminGroupToursPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePermission("groupTours.view");
  await connectToDatabase();

  const sp = await searchParams;
  const totalTours = await GroupTour.countDocuments();
  const totalPages = Math.max(1, Math.ceil(totalTours / PAGE_SIZE));
  const page = parsePage(sp.page, totalPages);

  const tours = await GroupTour.find()
    .sort({ startDate: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate<{ companyId: ICompany }>("companyId")
    .lean();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Group tours</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every group tour listed across all companies.
        </p>
      </div>

      {tours.length === 0 ? (
        <p className="text-sm text-muted-foreground">No group tours yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>B2B / B2C</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tours.map((tour) => (
                <TableRow key={tour._id.toString()}>
                  <TableCell>{tour.title}</TableCell>
                  <TableCell>{tour.companyId?.name ?? "—"}</TableCell>
                  <TableCell>
                    {formatDate(tour.startDate)} – {formatDate(tour.endDate)}
                  </TableCell>
                  <TableCell>
                    {tour.bookedSeats}/{tour.totalSeats}
                  </TableCell>
                  <TableCell>
                    {tour.rateB2B ?? "—"} / {tour.rateB2C ?? "—"}
                  </TableCell>
                  <TableCell>
                    {tour.isFull ? <Badge variant="outline">Full</Badge> : <Badge variant="secondary">Open</Badge>}
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
        hrefFor={(nextPage) => (nextPage > 1 ? `/admin/group-tours?page=${nextPage}` : "/admin/group-tours")}
      />
    </div>
  );
}
