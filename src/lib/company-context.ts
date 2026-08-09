import { cookies } from "next/headers";
import { getServerSession, type Session } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth-options";
import { connectToDatabase } from "@/lib/mongodb";
import { CompanyPartner } from "@/models";
import type { ICompanyPartner, MemberType } from "@/models";

export const ACTIVE_COMPANY_COOKIE = "activeCompanyId";

export interface PlainCompany {
  id: string;
  name: string;
  memberTypes: MemberType[];
  licenceNumbers: string[];
}

export interface CompanyMembership {
  company: PlainCompany;
  partner: {
    id: string;
    personName: string;
    personPhone: string;
    roleInCompany: "owner" | "partner";
  };
}

export async function requireMemberSession(): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function getUserCompanies(userId: string): Promise<CompanyMembership[]> {
  await connectToDatabase();
  const partners = await CompanyPartner.find({ userId, status: "active" })
    .populate<{
      companyId: {
        _id: { toString(): string };
        name: string;
        memberTypes: MemberType[];
        licenceNumbers: string[];
      };
    }>("companyId")
    .sort({ createdAt: 1 })
    .lean();

  return partners
    .filter((partner) => partner.companyId)
    .map((partner) => ({
      company: {
        id: partner.companyId._id.toString(),
        name: partner.companyId.name,
        memberTypes: partner.companyId.memberTypes,
        licenceNumbers: partner.companyId.licenceNumbers,
      },
      partner: {
        id: partner._id.toString(),
        personName: partner.personName,
        personPhone: partner.personPhone,
        roleInCompany: partner.roleInCompany,
      },
    }));
}

export async function getActiveCompany(userId: string): Promise<{
  company: PlainCompany;
  partner: CompanyMembership["partner"];
  memberships: CompanyMembership[];
} | null> {
  const memberships = await getUserCompanies(userId);
  if (memberships.length === 0) {
    return null;
  }

  const cookieStore = await cookies();
  const activeCompanyId = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value;
  const match = activeCompanyId
    ? memberships.find((membership) => membership.company.id === activeCompanyId)
    : undefined;
  const chosen = match ?? memberships[0];

  return { company: chosen.company, partner: chosen.partner, memberships };
}

export async function requireCompanyPartner(
  companyId: string,
  userId: string
): Promise<ICompanyPartner> {
  await connectToDatabase();
  const partner = await CompanyPartner.findOne({ companyId, userId, status: "active" });
  if (!partner) {
    throw new Error("You are not a partner of this company.");
  }
  return partner;
}
