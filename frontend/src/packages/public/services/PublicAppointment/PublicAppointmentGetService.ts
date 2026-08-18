import { PublicAppointmentGetData } from '@/packages/public/data/PublicAppointment/PublicAppointmentGetData';
import type { PublicAppointmentTokenParams } from '@repo/contracts';

export async function PublicAppointmentGetService(
  publicAppointmentTokenParams: PublicAppointmentTokenParams,
) {
  return PublicAppointmentGetData(publicAppointmentTokenParams);
}
