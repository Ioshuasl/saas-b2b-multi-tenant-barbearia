import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { CustomerAppointmentListResult } from '../../types/customer_appointments.types.js';
import { AppointmentStatus } from '../../enum/appointment/appointment_status.enum.js';

export class ListByCustomerRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    customerId: string,
  ): Promise<CustomerAppointmentListResult> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.appointment.findMany({
        where: { customerId },
        include: {
          location: { select: { name: true } },
          staff: { select: { name: true } },
          services: { include: { service: { select: { name: true } } } },
        },
        orderBy: { startsAt: 'desc' },
      });

      const items = rows.map((row) => ({
        id: row.id,
        locationId: row.locationId,
        locationName: row.location.name,
        staffId: row.staffId,
        staffName: row.staff.name,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt.toISOString(),
        status: row.status,
        totalPriceCents: Number(row.totalPriceCents),
        services: row.services.map((line) => ({
          name: line.service.name,
          priceCents: Number(line.priceCents),
          durationMinutes: line.durationMinutes,
        })),
      }));

      const totalSpentCents = rows
        .filter((row) => row.status === AppointmentStatus.COMPLETED)
        .reduce((acc, row) => acc + Number(row.totalPriceCents), 0);

      return { items, totalSpentCents };
    });
  }
}
