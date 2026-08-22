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
import { hasPermission, requirePermission } from "@/lib/permissions";
import { Company, CompanyPartner, GroupTour, Property } from "@/models";
import { RemoveCompanyButton } from "./remove-company-button";

const PAGE_SIZE = 20;

function parsePage(value: string | undefined, totalPages: number): number {
  const parsed = value ? parseInt(value, 10) : 1;
  const safe = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  return Math.min(safe, totalPages);
}

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { permissions } = await requirePermission("companies.manage");
  const canManageCompanies = hasPermission(permissions, "companies.manage");
  await connectToDatabase();

  const sp = await searchParams;
  const totalCompanies = await Company.countDocuments();
  const totalPages = Math.max(1, Math.ceil(totalCompanies / PAGE_SIZE));
  const page = parsePage(sp.page, totalPages);

  const companies = await Company.find()
    .sort({ name: 1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();

  const companyIds = companies.map((company) => company._id);

  const [partners, propertyCounts, tourCounts] = await Promise.all([
    CompanyPartner.find({ companyId: { $in: companyIds }, status: "active" }).lean(),
    Property.aggregate<{ _id: unknown; count: number }>([
      { $match: { companyId: { $in: companyIds } } },
      { $group: { _id: "$companyId", count: { $sum: 1 } } },
    ]),
    GroupTour.aggregate<{ _id: unknown; count: number }>([
      { $match: { companyId: { $in: companyIds } } },
      { $group: { _id: "$companyId", count: { $sum: 1 } } },
    ]),
  ]);

  const partnersByCompany = new Map<string, typeof partners>();
  for (const partner of partners) {
    const key = partner.companyId.toString();
    const list = partnersByCompany.get(key) ?? [];
    list.push(partner);
    partnersByCompany.set(key, list);
  }
  const propertyCountByCompany = new Map(propertyCounts.map((row) => [String(row._id), row.count]));
  const tourCountByCompany = new Map(tourCounts.map((row) => [String(row._id), row.count]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Companies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse every registered company and remove one along with its partners, properties, and
          group tours.
        </p>
      </div>

      {companies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No companies yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Partners</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Group tours</TableHead>
                {canManageCompanies && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => {
                const id = company._id.toString();
                const companyPartners = partnersByCompany.get(id) ?? [];
                return (
                  <TableRow key={id}>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {company.memberTypes.length > 0
                          ? company.memberTypes.map((type) => (
                              <Badge key={type} variant="secondary">
                                {type}
                              </Badge>
                            ))
                          : "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {companyPartners.length > 0
                        ? companyPartners.map((partner) => partner.personName).join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell>{propertyCountByCompany.get(id) ?? 0}</TableCell>
                    <TableCell>{tourCountByCompany.get(id) ?? 0}</TableCell>
                    {canManageCompanies && (
                      <TableCell className="text-right">
                        <RemoveCompanyButton companyId={id} companyName={company.name} />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <PaginationLinks
        page={page}
        totalPages={totalPages}
        hrefFor={(nextPage) => (nextPage > 1 ? `/admin/companies?page=${nextPage}` : "/admin/companies")}
      />
    </div>
  );
}
