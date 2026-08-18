import { apiClient } from '@/shared/api/api-client';
import { createIdempotencyKey } from '@/shared/helpers/IdempotencyKey';
import type { AppointmentCreateBody, AppointmentDetail } from '@repo/contracts';

export async function AppointmentCreateData(
  appointmentSchema: AppointmentCreateBody,
): Promise<AppointmentDetail> {
  return apiClient.request('/appointments', {
    method: 'POST',
    headers: { 'Idempotency-Key': createIdempotencyKey() },
    body: JSON.stringify(appointmentSchema),
  });
}
