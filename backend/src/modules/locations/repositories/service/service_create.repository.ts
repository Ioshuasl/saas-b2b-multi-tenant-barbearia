import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { ServiceCreateSchema } from '../../schemas/service.schema.js';
import type { ServiceSummary } from '../../types/service/service.types.js';
import { toServiceSummary } from './mappers/service.mapper.js';

export class CreateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, serviceSchema: ServiceCreateSchema): Promise<ServiceSummary> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const created = await tx.service.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          name: serviceSchema.name,
          description: serviceSchema.description,
          durationMinutes: serviceSchema.durationMinutes,
          bufferMinutes: serviceSchema.bufferMinutes,
          priceCents: BigInt(serviceSchema.priceCents ?? 0),
          color: serviceSchema.color,
          visibleOnline: serviceSchema.visibleOnline,
          sortOrder: serviceSchema.sortOrder,
        },
      });
      return toServiceSummary(created);
    });
  }
}
