import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { ACTIVE_APPOINTMENT_STATUSES } from '../../enum/appointment/appointment_status.enum.js';

export class CountFutureRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, phone: string): Promise<number> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      return tx.appointment.count({
        where: {
          startsAt: { gt: new Date() },
          status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
          customer: { phone, deletedAt: null },
        },
      });
    });
  }
}
