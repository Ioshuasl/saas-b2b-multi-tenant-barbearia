import { PublicAppointmentDeleteData } from '@/packages/public/data/PublicAppointment/PublicAppointmentDeleteData';
import type { PublicAppointmentTokenParams, PublicCancelBody } from '@repo/contracts';

export async function PublicAppointmentDeleteService(
  publicAppointmentTokenParams: PublicAppointmentTokenParams,
  publicCancelSchema: PublicCancelBody = {},
) {
  return PublicAppointmentDeleteData(publicAppointmentTokenParams, publicCancelSchema);
}
