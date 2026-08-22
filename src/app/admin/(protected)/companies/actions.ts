"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth-options";
import { deleteCompanyCascade } from "@/lib/admin-cascade";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionPermissions, hasPermission } from "@/lib/permissions";
import { deleteCompanySchema } from "@/lib/validation/admin";
import { Company } from "@/models";

export interface CompanyActionState {
  formError?: string;
}

async function requireCompaniesManagePermission() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: "Not authenticated." } as const;
  }
  const permissions = await getSessionPermissions(session.user.roles);
  if (!hasPermission(permissions, "companies.manage")) {
    return { error: "You do not have permission to do this." } as const;
  }
  return { session } as const;
}

export async function removeCompanyAction(
  _prevState: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const auth = await requireCompaniesManagePermission();
  if ("error" in auth) {
    return { formError: auth.error };
  }

  const parsed = deleteCompanySchema.safeParse({ companyId: formData.get("companyId") });
  if (!parsed.success) {
    return { formError: "Invalid request." };
  }

  await connectToDatabase();
  const company = await Company.findById(parsed.data.companyId);
  if (!company) {
    return { formError: "This company could not be found." };
  }

  await deleteCompanyCascade(company._id);

  revalidatePath("/admin/companies");
  revalidatePath("/admin/members");
  revalidatePath("/admin/properties");
  revalidatePath("/admin/group-tours");
  return {};
}
