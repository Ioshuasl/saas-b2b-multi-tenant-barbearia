import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { AppointmentDetail } from '../../types/appointment/appointment.types.js';
import { toAppointmentSummary } from './mappers/appointment_summary.mapper.js';

const include = {
  customer: { select: { name: true } },
  staff: { select: { name: true } },
  services: {
    include: { service: { select: { name: true } } },
  },
} as const;

export class GetRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, appointmentId: string): Promise<AppointmentDetail | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include,
      });
      if (!row) return null;
      return {
        ...toAppointmentSummary(row),
        notes: row.notes,
      };
    });
  }
}
