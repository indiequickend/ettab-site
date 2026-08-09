import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { connectToDatabase } from "@/lib/mongodb";
import { requirePermission } from "@/lib/permissions";
import { CompanyPartner, User } from "@/models";
import type { ICompany } from "@/models";
import { MemberRowActions } from "./member-row-actions";

export default async function AdminMembersPage() {
  await requirePermission("members.approve");
  await connectToDatabase();

  const pending = await User.find({ status: "pending_approval" })
    .sort({ createdAt: 1 })
    .lean();

  const partners = await CompanyPartner.find({
    userId: { $in: pending.map((user) => user._id) },
  }).populate<{ companyId: ICompany }>("companyId");

  const companyByUserId = new Map(partners.map((partner) => [partner.userId.toString(), partner.companyId]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pending registrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve or reject members who have verified their email and are awaiting admin approval.
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending registrations.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Member type</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((user) => {
                const company = companyByUserId.get(user._id.toString());
                return (
                  <TableRow key={user._id.toString()}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{company?.name ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {company?.memberTypes.map((type) => (
                          <Badge key={type} variant="secondary">
                            {type}
                          </Badge>
                        )) ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <MemberRowActions userId={user._id.toString()} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
