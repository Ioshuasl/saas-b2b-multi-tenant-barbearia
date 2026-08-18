import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { ServiceUpdateSchema } from '../../schemas/service.schema.js';
import type { ServiceSummary } from '../../types/service/service.types.js';
import { toServiceSummary } from './mappers/service.mapper.js';

export class UpdateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    serviceId: string,
    serviceSchema: ServiceUpdateSchema,
  ): Promise<ServiceSummary | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const current = await tx.service.findFirst({
        where: { id: serviceId, deletedAt: null },
      });
      if (!current) return null;
      const updated = await tx.service.update({
        where: { id: serviceId },
        data: {
          name: serviceSchema.name,
          description: serviceSchema.description,
          durationMinutes: serviceSchema.durationMinutes,
          bufferMinutes: serviceSchema.bufferMinutes,
          priceCents:
            serviceSchema.priceCents === undefined
              ? undefined
              : BigInt(serviceSchema.priceCents),
          color: serviceSchema.color,
          active: serviceSchema.active,
          visibleOnline: serviceSchema.visibleOnline,
          sortOrder: serviceSchema.sortOrder,
          deletedAt: serviceSchema.active === false ? current.deletedAt : current.deletedAt,
        },
      });
      return toServiceSummary(updated);
    });
  }
}
