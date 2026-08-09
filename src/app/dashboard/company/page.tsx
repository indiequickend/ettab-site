import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCompany, requireMemberSession } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { CompanyPartner, Invite } from "@/models";
import { CompanyDetailsCard } from "./company-details-card";
import { CompanySwitcher } from "./company-switcher";
import { InvitePartnerForm } from "./invite-partner-form";
import { PartnersTable, PendingInvitesTable, type InviteRow, type PartnerRow } from "./partners-table";

export default async function CompanyPage() {
  const session = await requireMemberSession();
  const active = await getActiveCompany(session.user.id!);

  if (!active) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>No company found</CardTitle>
            <CardDescription>
              You aren&apos;t linked to any company yet. Contact ETTAB admin if you believe this is
              a mistake.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard" className="text-sm underline">
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { company, memberships } = active;

  await connectToDatabase();
  const [partnerDocs, inviteDocs] = await Promise.all([
    CompanyPartner.find({ companyId: company.id, status: "active" }).sort({ createdAt: 1 }).lean(),
    Invite.find({ companyId: company.id, status: "pending", expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const partners: PartnerRow[] = partnerDocs.map((partner) => ({
    id: partner._id.toString(),
    userId: partner.userId.toString(),
    personName: partner.personName,
    personPhone: partner.personPhone,
    roleInCompany: partner.roleInCompany,
  }));

  const invites: InviteRow[] = inviteDocs.map((invite) => ({
    id: invite._id.toString(),
    email: invite.email,
    createdAt: invite.createdAt.toLocaleDateString(),
    expiresAt: invite.expiresAt.toLocaleDateString(),
  }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My company</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your company profile and the partners linked to it.
        </p>
      </div>

      {memberships.length > 1 && (
        <CompanySwitcher memberships={memberships} activeCompanyId={company.id} />
      )}

      <CompanyDetailsCard company={company} />

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Partners</h2>
        <PartnersTable partners={partners} currentUserId={session.user.id!} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Invite a partner</h2>
        <InvitePartnerForm companyId={company.id} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Pending invites</h2>
        <PendingInvitesTable invites={invites} />
      </div>
    </div>
  );
}
