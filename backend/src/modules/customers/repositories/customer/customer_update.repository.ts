import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { CustomerUpdateSchema } from '../../schemas/customer.schema.js';
import type { CustomerDetail } from '../../types/customer/customer.types.js';
import { toCustomerDetail } from './mappers/customer.mapper.js';

export class UpdateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    customerId: string,
    customerSchema: CustomerUpdateSchema,
    sealedNotes: string | null | undefined,
    plainNotes: string | null | undefined,
  ): Promise<CustomerDetail | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.customer.findFirst({
        where: { id: customerId, deletedAt: null },
      });
      if (!existing) return null;

      const updated = await tx.customer.update({
        where: { id: customerId },
        data: {
          name: customerSchema.name,
          email: customerSchema.email,
          birthdate:
            customerSchema.birthdate === undefined
              ? undefined
              : customerSchema.birthdate === null
                ? null
                : new Date(`${customerSchema.birthdate}T00:00:00.000Z`),
          marketingOptIn: customerSchema.marketingOptIn,
          active: customerSchema.active,
          notes: sealedNotes === undefined ? undefined : sealedNotes,
        },
      });

      let notes = plainNotes;
      if (notes === undefined && customerSchema.notes === undefined) {
        notes = null;
      }

      return toCustomerDetail(updated, notes ?? null);
    });
  }

  async updateMarketingOptIn(
    ctx: RequestContext,
    customerId: string,
    marketingOptIn: boolean,
  ): Promise<void> {
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.customer.update({
        where: { id: customerId },
        data: { marketingOptIn },
      });
    });
  }
}
