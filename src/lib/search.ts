import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import { Company, CompanyPartner, Place, Property, ServiceArea, Vehicle } from "@/models";
import type { MemberType } from "@/models";

export interface SearchResultCompany {
  companyId: string;
  companyName: string;
  memberTypes: MemberType[];
  matchedProperties: {
    id: string;
    name: string;
    category: string | null;
    totalRooms: number | null;
    capacity: number | null;
    rateB2B: string | null;
    rateB2C: string | null;
    photoLinks: string[];
    googleBusinessLink: string | null;
    facebookLink: string | null;
    website: string | null;
  }[];
  matchedVehicles: {
    id: string;
    name: string;
    vehicleType: string | null;
    capacity: number | null;
    rateB2B: string | null;
    rateB2C: string | null;
    photoLinks: string[];
    googleBusinessLink: string | null;
    facebookLink: string | null;
    website: string | null;
  }[];
  servesArea: boolean;
  partners: { id: string; name: string; phone: string }[];
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function searchByPlace(
  placeId: string,
  memberTypes?: MemberType[]
): Promise<{
  place: { id: string; name: string; isState: boolean } | null;
  results: SearchResultCompany[];
}> {
  if (!Types.ObjectId.isValid(placeId)) {
    return { place: null, results: [] };
  }

  await connectToDatabase();

  const placeDoc = await Place.findById(placeId).lean();
  if (!placeDoc) {
    return { place: null, results: [] };
  }
  const place = { id: placeDoc._id.toString(), name: placeDoc.name, isState: placeDoc.isState };

  const [properties, serviceAreas, vehicles] = await Promise.all([
    Property.find({ placeId }).lean(),
    ServiceArea.find({ placeId }).lean(),
    Vehicle.find({ placeId }).lean(),
  ]);

  const companyIds = Array.from(
    new Set([
      ...properties.map((property) => property.companyId.toString()),
      ...serviceAreas.map((serviceArea) => serviceArea.companyId.toString()),
      ...vehicles.map((vehicle) => vehicle.companyId.toString()),
    ])
  );

  if (companyIds.length === 0) {
    return { place, results: [] };
  }

  const [companies, partners] = await Promise.all([
    Company.find({ _id: { $in: companyIds } }).lean(),
    CompanyPartner.find({ companyId: { $in: companyIds }, status: "active" }).lean(),
  ]);

  const propertiesByCompany = new Map<string, typeof properties>();
  for (const property of properties) {
    const key = property.companyId.toString();
    const existing = propertiesByCompany.get(key);
    if (existing) {
      existing.push(property);
    } else {
      propertiesByCompany.set(key, [property]);
    }
  }

  const vehiclesByCompany = new Map<string, typeof vehicles>();
  for (const vehicle of vehicles) {
    const key = vehicle.companyId.toString();
    const existing = vehiclesByCompany.get(key);
    if (existing) {
      existing.push(vehicle);
    } else {
      vehiclesByCompany.set(key, [vehicle]);
    }
  }

  const servesAreaByCompany = new Set(
    serviceAreas.map((serviceArea) => serviceArea.companyId.toString())
  );

  const partnersByCompany = new Map<string, typeof partners>();
  for (const partner of partners) {
    const key = partner.companyId.toString();
    const existing = partnersByCompany.get(key);
    if (existing) {
      existing.push(partner);
    } else {
      partnersByCompany.set(key, [partner]);
    }
  }

  let results: SearchResultCompany[] = companies.map((company) => {
    const companyId = company._id.toString();
    return {
      companyId,
      companyName: company.name,
      memberTypes: company.memberTypes,
      matchedProperties: (propertiesByCompany.get(companyId) ?? []).map((property) => ({
        id: property._id.toString(),
        name: property.name,
        category: property.category,
        totalRooms: property.totalRooms,
        capacity: property.capacity,
        rateB2B: property.rateB2B,
        rateB2C: property.rateB2C,
        photoLinks: property.photoLinks,
        googleBusinessLink: property.googleBusinessLink,
        facebookLink: property.facebookLink,
        website: property.website,
      })),
      matchedVehicles: (vehiclesByCompany.get(companyId) ?? []).map((vehicle) => ({
        id: vehicle._id.toString(),
        name: vehicle.name,
        vehicleType: vehicle.vehicleType,
        capacity: vehicle.capacity,
        rateB2B: vehicle.rateB2B,
        rateB2C: vehicle.rateB2C,
        photoLinks: vehicle.photoLinks,
        googleBusinessLink: vehicle.googleBusinessLink,
        facebookLink: vehicle.facebookLink,
        website: vehicle.website,
      })),
      servesArea: servesAreaByCompany.has(companyId),
      partners: (partnersByCompany.get(companyId) ?? []).map((partner) => ({
        id: partner._id.toString(),
        name: partner.personName,
        phone: partner.personPhone,
      })),
    };
  });

  if (memberTypes && memberTypes.length > 0) {
    results = results.filter((result) =>
      result.memberTypes.some((type) => memberTypes.includes(type))
    );
  }

  return { place, results: shuffle(results) };
}
