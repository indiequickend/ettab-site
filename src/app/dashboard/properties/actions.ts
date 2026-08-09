"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth-options";
import { requireCompanyPartner } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { resolvePlaceId } from "@/lib/places";
import {
  deletePropertySchema,
  propertySchema,
  updatePropertySchema,
} from "@/lib/validation/property";
import { Property } from "@/models";

export interface PropertyActionState {
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

function parsePhotoLinks(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function createPropertyAction(
  _prevState: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = propertySchema.safeParse({
    companyId: formData.get("companyId"),
    name: formData.get("name"),
    category: formData.get("category") || undefined,
    totalRooms: formData.get("totalRooms") || undefined,
    capacity: formData.get("capacity") || undefined,
    rateB2B: formData.get("rateB2B") || undefined,
    rateB2C: formData.get("rateB2C") || undefined,
    photoLinks: formData.get("photoLinks") || undefined,
    googleBusinessLink: formData.get("googleBusinessLink") || "",
    facebookLink: formData.get("facebookLink") || "",
    website: formData.get("website") || "",
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

  await Property.create({
    companyId: parsed.data.companyId,
    placeId,
    name: parsed.data.name,
    category: parsed.data.category || null,
    totalRooms: parsed.data.totalRooms ?? null,
    capacity: parsed.data.capacity ?? null,
    rateB2B: parsed.data.rateB2B || null,
    rateB2C: parsed.data.rateB2C || null,
    photoLinks: parsePhotoLinks(parsed.data.photoLinks),
    googleBusinessLink: parsed.data.googleBusinessLink ?? null,
    facebookLink: parsed.data.facebookLink ?? null,
    website: parsed.data.website ?? null,
    createdBy: auth.userId,
  });

  revalidatePath("/dashboard/properties");
  return {};
}

export async function updatePropertyAction(
  _prevState: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = updatePropertySchema.safeParse({
    propertyId: formData.get("propertyId"),
    name: formData.get("name"),
    category: formData.get("category") || undefined,
    totalRooms: formData.get("totalRooms") || undefined,
    capacity: formData.get("capacity") || undefined,
    rateB2B: formData.get("rateB2B") || undefined,
    rateB2C: formData.get("rateB2C") || undefined,
    photoLinks: formData.get("photoLinks") || undefined,
    googleBusinessLink: formData.get("googleBusinessLink") || "",
    facebookLink: formData.get("facebookLink") || "",
    website: formData.get("website") || "",
    placeId: formData.get("placeId") || undefined,
    placeName: formData.get("placeName") || undefined,
    placeIsState: formData.get("placeIsState") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await connectToDatabase();
  const property = await Property.findById(parsed.data.propertyId);
  if (!property) {
    return { formError: "This property could not be found." };
  }

  try {
    await requireCompanyPartner(property.companyId.toString(), auth.userId);
  } catch {
    return { formError: "You are not a partner of this company." };
  }

  const placeId = await resolvePlaceId(parsed.data);

  await Property.findByIdAndUpdate(property._id, {
    placeId,
    name: parsed.data.name,
    category: parsed.data.category || null,
    totalRooms: parsed.data.totalRooms ?? null,
    capacity: parsed.data.capacity ?? null,
    rateB2B: parsed.data.rateB2B || null,
    rateB2C: parsed.data.rateB2C || null,
    photoLinks: parsePhotoLinks(parsed.data.photoLinks),
    googleBusinessLink: parsed.data.googleBusinessLink ?? null,
    facebookLink: parsed.data.facebookLink ?? null,
    website: parsed.data.website ?? null,
  });

  revalidatePath("/dashboard/properties");
  return {};
}

export async function deletePropertyAction(
  _prevState: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = deletePropertySchema.safeParse({ propertyId: formData.get("propertyId") });
  if (!parsed.success) {
    return { formError: "Invalid request." };
  }

  await connectToDatabase();
  const property = await Property.findById(parsed.data.propertyId);
  if (!property) {
    return { formError: "This property could not be found." };
  }

  try {
    await requireCompanyPartner(property.companyId.toString(), auth.userId);
  } catch {
    return { formError: "You are not a partner of this company." };
  }

  await property.deleteOne();

  revalidatePath("/dashboard/properties");
  return {};
}
