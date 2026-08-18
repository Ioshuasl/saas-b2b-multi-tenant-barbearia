import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { phoneSearchDigits } from '../../helpers/phone_e164.js';
import type { CustomerListQuerySchema } from '../../schemas/customer.schema.js';
import type { CustomerSummary } from '../../types/customer/customer.types.js';
import { toCustomerSummary } from './mappers/customer.mapper.js';

export type CustomerListResult = {
  items: CustomerSummary[];
  nextCursor?: string;
};

export class ListRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, query: CustomerListQuerySchema): Promise<CustomerListResult> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const limit = query.limit ?? 50;
      const where: Prisma.CustomerWhereInput = {};

      if (query.active === true) {
        where.active = true;
        where.deletedAt = null;
      } else if (query.active === false) {
        where.OR = [{ active: false }, { deletedAt: { not: null } }];
      } else {
        where.deletedAt = null;
      }

      if (query.search) {
        const digits = phoneSearchDigits(query.search);
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          ...(digits.length >= 8 ? [{ phone: { contains: digits } }] : []),
        ];
      }

      if (query.cursor) {
        where.id = { gt: query.cursor };
      }

      const rows = await tx.customer.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        take: limit + 1,
      });

      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;

      return {
        items: page.map(toCustomerSummary),
        nextCursor: hasMore ? page[page.length - 1]?.id : undefined,
      };
    });
  }
}
