import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { CustomerSummary } from '../../types/customer/customer.types.js';
import { toCustomerSummary } from './mappers/customer.mapper.js';

export class GetByPhoneRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, phone: string): Promise<CustomerSummary | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.customer.findFirst({
        where: { phone, deletedAt: null },
      });
      return row ? toCustomerSummary(row) : null;
    });
  }
}
