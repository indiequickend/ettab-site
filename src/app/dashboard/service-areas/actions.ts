"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth-options";
import { requireCompanyPartner } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { resolvePlaceId } from "@/lib/places";
import { addServiceAreaSchema, removeServiceAreaSchema } from "@/lib/validation/service-area";
import { ServiceArea } from "@/models";

export interface ServiceAreaActionState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

async function requireSessionUserId(): Promise<{ userId: string } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated." };
  }
  return { userId: session.user.id };
}

export async function addServiceAreaAction(
  _prevState: ServiceAreaActionState,
  formData: FormData
): Promise<ServiceAreaActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = addServiceAreaSchema.safeParse({
    companyId: formData.get("companyId"),
    placeId: formData.get("placeId") || undefined,
    placeName: formData.get("placeName") || undefined,
    placeIsState: formData.get("placeIsState") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await connectToDatabase();
  try {
    await requireCompanyPartner(parsed.data.companyId, auth.userId);
  } catch {
    return { formError: "You are not a partner of this company." };
  }

  const placeId = await resolvePlaceId(parsed.data);

  const existing = await ServiceArea.findOne({ companyId: parsed.data.companyId, placeId });
  if (existing) {
    return { fieldErrors: { placeName: ["This service area is already added."] } };
  }

  await ServiceArea.create({
    companyId: parsed.data.companyId,
    placeId,
    createdBy: auth.userId,
  });

  revalidatePath("/dashboard/service-areas");
  return {};
}

export async function removeServiceAreaAction(
  _prevState: ServiceAreaActionState,
  formData: FormData
): Promise<ServiceAreaActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = removeServiceAreaSchema.safeParse({
    serviceAreaId: formData.get("serviceAreaId"),
  });
  if (!parsed.success) {
    return { formError: "Invalid request." };
  }

  await connectToDatabase();
  const serviceArea = await ServiceArea.findById(parsed.data.serviceAreaId);
  if (!serviceArea) {
    return { formError: "This service area could not be found." };
  }

  try {
    await requireCompanyPartner(serviceArea.companyId.toString(), auth.userId);
  } catch {
    return { formError: "You are not a partner of this company." };
  }

  await serviceArea.deleteOne();

  revalidatePath("/dashboard/service-areas");
  return {};
}
