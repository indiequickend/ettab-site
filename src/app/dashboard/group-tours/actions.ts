"use server";

import DOMPurify from "isomorphic-dompurify";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth-options";
import { requireCompanyPartner } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import {
  deleteGroupTourSchema,
  groupTourSchema,
  toggleFullGroupTourSchema,
  updateGroupTourSchema,
} from "@/lib/validation/group-tour";
import { GroupTour } from "@/models";

export interface GroupTourActionState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "s",
    "ul",
    "ol",
    "li",
    "a",
    "h1",
    "h2",
    "h3",
    "blockquote",
    "code",
  ],
  ALLOWED_ATTR: ["href", "target", "rel"],
};

function sanitizeDescription(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_OPTIONS);
}

async function requireSessionUserId(): Promise<{ userId: string } | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Not authenticated." };
  }
  return { userId: session.user.id };
}

function revalidateGroupTourPaths(groupTourId?: string) {
  revalidatePath("/dashboard/group-tours");
  revalidatePath("/dashboard");
  if (groupTourId) {
    revalidatePath(`/dashboard/group-tours/${groupTourId}`);
  }
}

export async function createGroupTourAction(
  _prevState: GroupTourActionState,
  formData: FormData
): Promise<GroupTourActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = groupTourSchema.safeParse({
    companyId: formData.get("companyId"),
    title: formData.get("title"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    durationLabel: formData.get("durationLabel"),
    totalSeats: formData.get("totalSeats"),
    bookedSeats: formData.get("bookedSeats") || undefined,
    rateB2B: formData.get("rateB2B") || undefined,
    rateB2C: formData.get("rateB2C") || undefined,
    description: formData.get("description"),
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

  const tour = await GroupTour.create({
    companyId: parsed.data.companyId,
    title: parsed.data.title,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    durationLabel: parsed.data.durationLabel,
    totalSeats: parsed.data.totalSeats,
    bookedSeats: parsed.data.bookedSeats,
    rateB2B: parsed.data.rateB2B || null,
    rateB2C: parsed.data.rateB2C || null,
    description: sanitizeDescription(parsed.data.description),
    createdBy: auth.userId,
  });

  revalidateGroupTourPaths(tour._id.toString());
  return {};
}

export async function updateGroupTourAction(
  _prevState: GroupTourActionState,
  formData: FormData
): Promise<GroupTourActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = updateGroupTourSchema.safeParse({
    groupTourId: formData.get("groupTourId"),
    title: formData.get("title"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    durationLabel: formData.get("durationLabel"),
    totalSeats: formData.get("totalSeats"),
    bookedSeats: formData.get("bookedSeats") || undefined,
    rateB2B: formData.get("rateB2B") || undefined,
    rateB2C: formData.get("rateB2C") || undefined,
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await connectToDatabase();
  const tour = await GroupTour.findById(parsed.data.groupTourId);
  if (!tour) {
    return { formError: "This group tour could not be found." };
  }

  try {
    await requireCompanyPartner(tour.companyId.toString(), auth.userId);
  } catch {
    return { formError: "You are not a partner of this company." };
  }

  await GroupTour.findByIdAndUpdate(tour._id, {
    title: parsed.data.title,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    durationLabel: parsed.data.durationLabel,
    totalSeats: parsed.data.totalSeats,
    bookedSeats: parsed.data.bookedSeats,
    rateB2B: parsed.data.rateB2B || null,
    rateB2C: parsed.data.rateB2C || null,
    description: sanitizeDescription(parsed.data.description),
  });

  revalidateGroupTourPaths(tour._id.toString());
  return {};
}

export async function deleteGroupTourAction(
  _prevState: GroupTourActionState,
  formData: FormData
): Promise<GroupTourActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = deleteGroupTourSchema.safeParse({ groupTourId: formData.get("groupTourId") });
  if (!parsed.success) {
    return { formError: "Invalid request." };
  }

  await connectToDatabase();
  const tour = await GroupTour.findById(parsed.data.groupTourId);
  if (!tour) {
    return { formError: "This group tour could not be found." };
  }

  try {
    await requireCompanyPartner(tour.companyId.toString(), auth.userId);
  } catch {
    return { formError: "You are not a partner of this company." };
  }

  await tour.deleteOne();

  revalidateGroupTourPaths();
  return {};
}

export async function toggleGroupTourFullAction(
  _prevState: GroupTourActionState,
  formData: FormData
): Promise<GroupTourActionState> {
  const auth = await requireSessionUserId();
  if ("error" in auth) return { formError: auth.error };

  const parsed = toggleFullGroupTourSchema.safeParse({
    groupTourId: formData.get("groupTourId"),
    isFull: formData.get("isFull"),
  });
  if (!parsed.success) {
    return { formError: "Invalid request." };
  }

  await connectToDatabase();
  const tour = await GroupTour.findById(parsed.data.groupTourId);
  if (!tour) {
    return { formError: "This group tour could not be found." };
  }

  try {
    await requireCompanyPartner(tour.companyId.toString(), auth.userId);
  } catch {
    return { formError: "You are not a partner of this company." };
  }

  await GroupTour.findByIdAndUpdate(tour._id, { isFull: parsed.data.isFull });

  revalidateGroupTourPaths(tour._id.toString());
  return {};
}
