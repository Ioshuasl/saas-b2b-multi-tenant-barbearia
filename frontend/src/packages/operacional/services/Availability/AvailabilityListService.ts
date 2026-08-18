import { AvailabilityListData } from '@/packages/operacional/data/Availability/AvailabilityListData';
import type { AvailabilityListQuery } from '@repo/contracts';

export async function AvailabilityListService(query: AvailabilityListQuery) {
  return AvailabilityListData(query);
}
