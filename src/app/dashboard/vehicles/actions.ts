"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth-options";
import { requireCompanyPartner } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { resolvePlaceId } from "@/lib/places";
import {
  deleteVehicleSchema,
  updateVehicleSchema,
  vehicleSchema,
} from "@/lib/validation/vehicle";
import { Vehicle } from "@/models";

export interface VehicleActionState {
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

export async function createVehicleAction(
  _prevState: VehicleActionState,
  formData: FormData
): Promise<VehicleActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = vehicleSchema.safeParse({
    companyId: formData.get("companyId"),
    name: formData.get("name"),
    vehicleType: formData.get("vehicleType") || undefined,
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

  await Vehicle.create({
    companyId: parsed.data.companyId,
    placeId,
    name: parsed.data.name,
    vehicleType: parsed.data.vehicleType || null,
    capacity: parsed.data.capacity ?? null,
    rateB2B: parsed.data.rateB2B || null,
    rateB2C: parsed.data.rateB2C || null,
    photoLinks: parsePhotoLinks(parsed.data.photoLinks),
    googleBusinessLink: parsed.data.googleBusinessLink ?? null,
    facebookLink: parsed.data.facebookLink ?? null,
    website: parsed.data.website ?? null,
    createdBy: auth.userId,
  });

  revalidatePath("/dashboard/vehicles");
  return {};
}

export async function updateVehicleAction(
  _prevState: VehicleActionState,
  formData: FormData
): Promise<VehicleActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = updateVehicleSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    name: formData.get("name"),
    vehicleType: formData.get("vehicleType") || undefined,
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
  const vehicle = await Vehicle.findById(parsed.data.vehicleId);
  if (!vehicle) {
    return { formError: "This vehicle could not be found." };
  }

  try {
    await requireCompanyPartner(vehicle.companyId.toString(), auth.userId);
  } catch {
    return { formError: "You are not a partner of this company." };
  }

  const placeId = await resolvePlaceId(parsed.data);

  await Vehicle.findByIdAndUpdate(vehicle._id, {
    placeId,
    name: parsed.data.name,
    vehicleType: parsed.data.vehicleType || null,
    capacity: parsed.data.capacity ?? null,
    rateB2B: parsed.data.rateB2B || null,
    rateB2C: parsed.data.rateB2C || null,
    photoLinks: parsePhotoLinks(parsed.data.photoLinks),
    googleBusinessLink: parsed.data.googleBusinessLink ?? null,
    facebookLink: parsed.data.facebookLink ?? null,
    website: parsed.data.website ?? null,
  });

  revalidatePath("/dashboard/vehicles");
  return {};
}

export async function deleteVehicleAction(
  _prevState: VehicleActionState,
  formData: FormData
): Promise<VehicleActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = deleteVehicleSchema.safeParse({ vehicleId: formData.get("vehicleId") });
  if (!parsed.success) {
    return { formError: "Invalid request." };
  }

  await connectToDatabase();
  const vehicle = await Vehicle.findById(parsed.data.vehicleId);
  if (!vehicle) {
    return { formError: "This vehicle could not be found." };
  }

  try {
    await requireCompanyPartner(vehicle.companyId.toString(), auth.userId);
  } catch {
    return { formError: "You are not a partner of this company." };
  }

  await vehicle.deleteOne();

  revalidatePath("/dashboard/vehicles");
  return {};
}
