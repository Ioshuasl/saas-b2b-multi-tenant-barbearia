import { PublicAppointmentCreateData } from '@/packages/public/data/PublicAppointment/PublicAppointmentCreateData';
import type { PublicBookBody, PublicSlugParams } from '@repo/contracts';

export async function PublicAppointmentCreateService(
  publicSlugParams: PublicSlugParams,
  publicBookSchema: PublicBookBody,
) {
  return PublicAppointmentCreateData(publicSlugParams, publicBookSchema);
}
