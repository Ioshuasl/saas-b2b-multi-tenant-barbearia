import { PublicLocationGetData } from '@/packages/public/data/PublicLocation/PublicLocationGetData';
import type { PublicSlugParams } from '@repo/contracts';

export async function PublicLocationGetService(publicSlugParams: PublicSlugParams) {
  return PublicLocationGetData(publicSlugParams);
}
