import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { CustomerDetail } from '../../types/customer/customer.types.js';
import { toCustomerDetail } from './mappers/customer.mapper.js';

export class GetRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, customerId: string): Promise<CustomerDetail | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.customer.findFirst({
        where: { id: customerId, deletedAt: null },
      });
      if (!row) return null;
      return toCustomerDetail(row, row.notes);
    });
  }
}
