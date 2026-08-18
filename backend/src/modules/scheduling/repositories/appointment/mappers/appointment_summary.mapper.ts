import type { Appointment, AppointmentService } from '@prisma/client';
import type { AppointmentSummary } from '../../../types/appointment/appointment.types.js';

type Row = Appointment & {
  customer: { name: string };
  staff: { name: string };
  services: Array<AppointmentService & { service: { name: string } }>;
};

export function toAppointmentSummary(row: Row): AppointmentSummary {
  return {
    id: row.id,
    locationId: row.locationId,
    customerId: row.customerId,
    customerName: row.customer.name,
    staffId: row.staffId,
    staffName: row.staff.name,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    status: row.status as AppointmentSummary['status'],
    source: row.source as AppointmentSummary['source'],
    totalPriceCents: Number(row.totalPriceCents),
    services: row.services.map((line) => ({
      serviceId: line.serviceId,
      name: line.service.name,
      priceCents: Number(line.priceCents),
      durationMinutes: line.durationMinutes,
    })),
  };
}
