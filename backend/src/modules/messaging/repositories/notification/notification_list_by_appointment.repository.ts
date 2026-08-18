import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class ListByAppointmentRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, appointmentId: string) {
    return this.db.runInTenantContext(ctx, async (tx) => {
      return tx.notification.findMany({
        where: { appointmentId },
        orderBy: { createdAt: 'asc' },
      });
    });
  }
}
