import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import { Company, CompanyPartner, GroupTour } from "@/models";

export interface GroupTourCardData {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  startDate: Date;
  endDate: Date;
  durationLabel: string;
  totalSeats: number;
  bookedSeats: number;
  seatsLeft: number;
  rateB2B: string | null;
  rateB2C: string | null;
}

export interface ManagedGroupTour extends GroupTourCardData {
  isFull: boolean;
}

export interface GroupTourDetail extends GroupTourCardData {
  description: string;
  isFull: boolean;
  isOwner: boolean;
  contacts: { id: string; name: string; phone: string }[];
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function attachCompanyNames<T extends { companyId: Types.ObjectId }>(
  docs: T[]
): Promise<Map<string, string>> {
  const companyIds = Array.from(new Set(docs.map((doc) => doc.companyId.toString())));
  if (companyIds.length === 0) {
    return new Map();
  }
  const companies = await Company.find({ _id: { $in: companyIds } })
    .select("name")
    .lean();
  return new Map(companies.map((company) => [company._id.toString(), company.name]));
}

export async function getUpcomingGroupTours({
  query,
  offset = 0,
  limit = 12,
}: {
  query?: string;
  offset?: number;
  limit?: number;
}): Promise<{ tours: GroupTourCardData[]; hasMore: boolean }> {
  await connectToDatabase();

  const filter: Record<string, unknown> = {
    isFull: false,
    startDate: { $gte: new Date() },
  };

  const trimmed = query?.trim();
  if (trimmed) {
    const regex = new RegExp(escapeRegExp(trimmed), "i");
    const matchingCompanies = await Company.find({ name: regex }).select("_id").lean();
    filter.$or = [
      { title: regex },
      { companyId: { $in: matchingCompanies.map((company) => company._id) } },
    ];
  }

  const tourDocs = await GroupTour.find(filter)
    .sort({ startDate: 1 })
    .skip(offset)
    .limit(limit + 1)
    .lean();

  const hasMore = tourDocs.length > limit;
  const page = hasMore ? tourDocs.slice(0, limit) : tourDocs;

  const companyNames = await attachCompanyNames(page);

  const tours: GroupTourCardData[] = page.map((tour) => ({
    id: tour._id.toString(),
    companyId: tour.companyId.toString(),
    companyName: companyNames.get(tour.companyId.toString()) ?? "Unknown company",
    title: tour.title,
    startDate: tour.startDate,
    endDate: tour.endDate,
    durationLabel: tour.durationLabel,
    totalSeats: tour.totalSeats,
    bookedSeats: tour.bookedSeats,
    seatsLeft: tour.totalSeats - tour.bookedSeats,
    rateB2B: tour.rateB2B,
    rateB2C: tour.rateB2C,
  }));

  return { tours, hasMore };
}

export async function getGroupToursForCompany(companyId: string): Promise<ManagedGroupTour[]> {
  await connectToDatabase();

  const tourDocs = await GroupTour.find({ companyId }).sort({ startDate: 1 }).lean();
  const companyNames = await attachCompanyNames(tourDocs);

  return tourDocs.map((tour) => ({
    id: tour._id.toString(),
    companyId: tour.companyId.toString(),
    companyName: companyNames.get(tour.companyId.toString()) ?? "Unknown company",
    title: tour.title,
    startDate: tour.startDate,
    endDate: tour.endDate,
    durationLabel: tour.durationLabel,
    totalSeats: tour.totalSeats,
    bookedSeats: tour.bookedSeats,
    seatsLeft: tour.totalSeats - tour.bookedSeats,
    rateB2B: tour.rateB2B,
    rateB2C: tour.rateB2C,
    isFull: tour.isFull,
  }));
}

export async function getGroupTourDetail(
  groupTourId: string,
  viewerCompanyId: string | null
): Promise<GroupTourDetail | null> {
  if (!Types.ObjectId.isValid(groupTourId)) {
    return null;
  }

  await connectToDatabase();

  const tour = await GroupTour.findById(groupTourId).lean();
  if (!tour) {
    return null;
  }

  const companyId = tour.companyId.toString();
  const [company, partners] = await Promise.all([
    Company.findById(companyId).select("name").lean(),
    CompanyPartner.find({ companyId, status: "active" }).lean(),
  ]);

  return {
    id: tour._id.toString(),
    companyId,
    companyName: company?.name ?? "Unknown company",
    title: tour.title,
    startDate: tour.startDate,
    endDate: tour.endDate,
    durationLabel: tour.durationLabel,
    totalSeats: tour.totalSeats,
    bookedSeats: tour.bookedSeats,
    seatsLeft: tour.totalSeats - tour.bookedSeats,
    rateB2B: tour.rateB2B,
    rateB2C: tour.rateB2C,
    description: tour.description,
    isFull: tour.isFull,
    isOwner: viewerCompanyId !== null && viewerCompanyId === companyId,
    contacts: partners.map((partner) => ({
      id: partner._id.toString(),
      name: partner.personName,
      phone: partner.personPhone,
    })),
  };
}
