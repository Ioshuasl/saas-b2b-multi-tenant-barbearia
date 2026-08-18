import { PublicAppointmentUpdateData } from '@/packages/public/data/PublicAppointment/PublicAppointmentUpdateData';
import type { PublicAppointmentTokenParams, PublicRescheduleBody } from '@repo/contracts';

export async function PublicAppointmentUpdateService(
  publicAppointmentTokenParams: PublicAppointmentTokenParams,
  publicRescheduleSchema: PublicRescheduleBody,
) {
  return PublicAppointmentUpdateData(publicAppointmentTokenParams, publicRescheduleSchema);
}
