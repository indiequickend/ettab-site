import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaginationLinks } from "@/components/admin/pagination-links";
import { connectToDatabase } from "@/lib/mongodb";
import { hasPermission, requirePermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { CompanyPartner, Role, User } from "@/models";
import type { ICompany } from "@/models";
import { MemberRowActions } from "./member-row-actions";
import { BlockMemberButton, RemoveMemberButton, UnblockMemberButton } from "./member-manage-actions";
import { ResendVerificationAction } from "./resend-verification-action";

const PAGE_SIZE = 20;

function parsePage(value: string | undefined, totalPages: number): number {
  const parsed = value ? parseInt(value, 10) : 1;
  const safe = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  return Math.min(safe, totalPages);
}

function buildMembersHref(params: {
  tab: "pending" | "all" | "unverified" | "blocked";
  pendingPage: number;
  allPage: number;
  unverifiedPage: number;
  blockedPage: number;
}) {
  const search = new URLSearchParams();
  search.set("tab", params.tab);
  if (params.pendingPage > 1) search.set("pendingPage", String(params.pendingPage));
  if (params.allPage > 1) search.set("allPage", String(params.allPage));
  if (params.unverifiedPage > 1) search.set("unverifiedPage", String(params.unverifiedPage));
  if (params.blockedPage > 1) search.set("blockedPage", String(params.blockedPage));
  const qs = search.toString();
  return `/admin/members${qs ? `?${qs}` : ""}`;
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    pendingPage?: string;
    allPage?: string;
    unverifiedPage?: string;
    blockedPage?: string;
  }>;
}) {
  const { permissions } = await requirePermission("members.approve");
  const canCreateMembers = hasPermission(permissions, "members.create");
  const canManageMembers = hasPermission(permissions, "members.manage");
  await connectToDatabase();

  const sp = await searchParams;
  const tab =
    sp.tab === "all"
      ? "all"
      : sp.tab === "unverified"
        ? "unverified"
        : sp.tab === "blocked"
          ? "blocked"
          : "pending";

  const [pendingCount, approvedCount, unverifiedCount, blockedCount] = await Promise.all([
    User.countDocuments({ status: "pending_approval" }),
    User.countDocuments({ status: "approved" }),
    User.countDocuments({ status: "pending_email" }),
    User.countDocuments({ status: "suspended" }),
  ]);

  const totalPendingPages = Math.max(1, Math.ceil(pendingCount / PAGE_SIZE));
  const totalAllPages = Math.max(1, Math.ceil(approvedCount / PAGE_SIZE));
  const totalUnverifiedPages = Math.max(1, Math.ceil(unverifiedCount / PAGE_SIZE));
  const totalBlockedPages = Math.max(1, Math.ceil(blockedCount / PAGE_SIZE));
  const pendingPage = parsePage(sp.pendingPage, totalPendingPages);
  const allPage = parsePage(sp.allPage, totalAllPages);
  const unverifiedPage = parsePage(sp.unverifiedPage, totalUnverifiedPages);
  const blockedPage = parsePage(sp.blockedPage, totalBlockedPages);

  const [pending, approvedUsers, unverifiedUsers, blockedUsers, roles] = await Promise.all([
    User.find({ status: "pending_approval" })
      .sort({ createdAt: 1 })
      .skip((pendingPage - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    User.find({ status: "approved" })
      .sort({ name: 1 })
      .skip((allPage - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    User.find({ status: "pending_email" })
      .sort({ createdAt: 1 })
      .skip((unverifiedPage - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    User.find({ status: "suspended" })
      .sort({ name: 1 })
      .skip((blockedPage - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Role.find().sort({ name: 1 }).lean(),
  ]);

  const partners = await CompanyPartner.find({
    userId: {
      $in: [
        ...pending.map((user) => user._id),
        ...approvedUsers.map((user) => user._id),
        ...unverifiedUsers.map((user) => user._id),
        ...blockedUsers.map((user) => user._id),
      ],
    },
  }).populate<{ companyId: ICompany }>("companyId");

  const companyByUserId = new Map(partners.map((partner) => [partner.userId.toString(), partner.companyId]));
  const roleOptions = roles.map((role) => ({ id: role._id.toString(), name: role.name }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve or reject pending registrations, and browse the full member roster.
          </p>
        </div>
        {canCreateMembers && (
          <Link href="/admin/members/new" className={cn(buttonVariants({ variant: "outline" }))}>
            Create member
          </Link>
        )}
      </div>

      <Tabs key={tab} defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="pending">Pending registrations</TabsTrigger>
          <TabsTrigger value="all">All members</TabsTrigger>
          <TabsTrigger value="unverified">Unverified</TabsTrigger>
          <TabsTrigger value="blocked">Blocked</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="flex flex-col gap-4">
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
          <PaginationLinks
            page={pendingPage}
            totalPages={totalPendingPages}
            hrefFor={(page) =>
              buildMembersHref({ tab: "pending", pendingPage: page, allPage, unverifiedPage, blockedPage })
            }
          />
        </TabsContent>

        <TabsContent value="all" className="flex flex-col gap-4">
          {approvedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Registered</TableHead>
                    {canManageMembers && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedUsers.map((user) => {
                    const company = companyByUserId.get(user._id.toString());
                    const userRoleIds = user.roleIds.map((id) => id.toString());
                    const userRoleNames = roleOptions.filter((role) => userRoleIds.includes(role.id));
                    return (
                      <TableRow key={user._id.toString()}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{company?.name ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {userRoleNames.length > 0
                              ? userRoleNames.map((role) => (
                                  <Badge key={role.id} variant="secondary">
                                    {role.name}
                                  </Badge>
                                ))
                              : "—"}
                          </div>
                        </TableCell>
                        <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
                        {canManageMembers && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <BlockMemberButton userId={user._id.toString()} />
                              <RemoveMemberButton userId={user._id.toString()} />
                            </div>
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
            page={allPage}
            totalPages={totalAllPages}
            hrefFor={(page) =>
              buildMembersHref({ tab: "all", pendingPage, allPage: page, unverifiedPage, blockedPage })
            }
          />
        </TabsContent>

        <TabsContent value="unverified" className="flex flex-col gap-4">
          {unverifiedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No unverified accounts.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unverifiedUsers.map((user) => {
                    const company = companyByUserId.get(user._id.toString());
                    return (
                      <TableRow key={user._id.toString()}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{company?.name ?? "—"}</TableCell>
                        <TableCell>{user.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <ResendVerificationAction userId={user._id.toString()} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <PaginationLinks
            page={unverifiedPage}
            totalPages={totalUnverifiedPages}
            hrefFor={(page) =>
              buildMembersHref({
                tab: "unverified",
                pendingPage,
                allPage,
                unverifiedPage: page,
                blockedPage,
              })
            }
          />
        </TabsContent>

        <TabsContent value="blocked" className="flex flex-col gap-4">
          {blockedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blocked members.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    {canManageMembers && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedUsers.map((user) => {
                    const company = companyByUserId.get(user._id.toString());
                    return (
                      <TableRow key={user._id.toString()}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{company?.name ?? "—"}</TableCell>
                        {canManageMembers && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <UnblockMemberButton userId={user._id.toString()} />
                              <RemoveMemberButton userId={user._id.toString()} />
                            </div>
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
            page={blockedPage}
            totalPages={totalBlockedPages}
            hrefFor={(page) =>
              buildMembersHref({ tab: "blocked", pendingPage, allPage, unverifiedPage, blockedPage: page })
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
