import { TimeBlockListData } from '@/packages/admin/data/TimeBlock/TimeBlockListData';

export async function TimeBlockListService(locationId: string) {
  return TimeBlockListData(locationId);
}
