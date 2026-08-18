import type { Appointment as AppointmentRow } from '@prisma/client';
import type { AppointmentSourceName } from '../../../enum/appointment/appointment_source.enum.js';
import type { AppointmentStatusName } from '../../../enum/appointment/appointment_status.enum.js';
import type { AppointmentRecord } from '../../../types/appointment/appointment.types.js';

export function toAppointmentRecord(row: AppointmentRow): AppointmentRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    locationId: row.locationId,
    customerId: row.customerId,
    staffId: row.staffId,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    status: row.status as AppointmentStatusName,
    source: row.source as AppointmentSourceName,
    totalPriceCents: Number(row.totalPriceCents),
    notes: row.notes,
  };
}
