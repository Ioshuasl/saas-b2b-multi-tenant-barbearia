import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { StaffSummary } from '../../types/staff/staff.types.js';
import { toStaffSummary } from './mappers/staff.mapper.js';

export class GetRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, staffId: string): Promise<StaffSummary | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.staff.findFirst({
        where: { id: staffId, deletedAt: null },
        include: { staffLocations: true, staffServices: true },
      });
      return row ? toStaffSummary(row) : null;
    });
  }
}
