import { PublicAvailabilityListData } from '@/packages/public/data/PublicAvailability/PublicAvailabilityListData';
import type { PublicAvailabilityListQuery } from '@repo/contracts';

export async function PublicAvailabilityListService(query: PublicAvailabilityListQuery) {
  return PublicAvailabilityListData(query);
}
