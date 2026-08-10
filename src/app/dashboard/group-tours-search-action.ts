"use server";

import { getUpcomingGroupTours, type GroupTourCardData } from "@/lib/group-tours";

export async function loadMoreGroupToursAction(
  query: string,
  offset: number
): Promise<{ tours: GroupTourCardData[]; hasMore: boolean }> {
  return getUpcomingGroupTours({ query, offset, limit: 12 });
}
