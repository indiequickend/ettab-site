import type { Types } from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import { Company, CompanyPartner, GroupTour, Invite, Property, ServiceArea, Vehicle } from "@/models";

/**
 * Deletes a company along with everything that hangs off it: partner links,
 * properties, service areas, group tours, vehicles, and any pending partner
 * invites.
 */
export async function deleteCompanyCascade(companyId: Types.ObjectId | string): Promise<void> {
  await connectToDatabase();
  await Promise.all([
    CompanyPartner.deleteMany({ companyId }),
    Property.deleteMany({ companyId }),
    ServiceArea.deleteMany({ companyId }),
    GroupTour.deleteMany({ companyId }),
    Vehicle.deleteMany({ companyId }),
    Invite.deleteMany({ companyId }),
  ]);
  await Company.deleteOne({ _id: companyId });
}

/**
 * Call after blocking or removing a member. A company survives only while it
 * still has at least one active partner whose own account is approved - once
 * the last operable partner is gone, the company (and everything under it)
 * is removed too.
 */
export async function removeOrphanedCompanies(
  companyIds: (Types.ObjectId | string)[]
): Promise<void> {
  await connectToDatabase();
  const uniqueIds = [...new Set(companyIds.map((id) => id.toString()))];

  for (const companyId of uniqueIds) {
    const activePartners = await CompanyPartner.find({ companyId, status: "active" }).populate<{
      userId: { status: string } | null;
    }>("userId");
    const hasOperablePartner = activePartners.some(
      (partner) => partner.userId && partner.userId.status === "approved"
    );
    if (!hasOperablePartner) {
      await deleteCompanyCascade(companyId);
    }
  }
}
