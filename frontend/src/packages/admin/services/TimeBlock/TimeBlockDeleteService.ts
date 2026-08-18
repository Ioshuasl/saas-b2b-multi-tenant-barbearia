import { TimeBlockDeleteData } from '@/packages/admin/data/TimeBlock/TimeBlockDeleteData';

export async function TimeBlockDeleteService(id: string) {
  return TimeBlockDeleteData(id);
}
