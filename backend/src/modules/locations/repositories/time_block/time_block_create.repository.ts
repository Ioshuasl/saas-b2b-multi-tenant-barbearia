import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { TimeBlockCreateSchema } from '../../schemas/time_block.schema.js';
import type { TimeBlockSummary } from '../../types/time_block/time_block.types.js';
import { toTimeBlockSummary } from './mappers/time_block.mapper.js';

export class CreateRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    timeBlockSchema: TimeBlockCreateSchema,
  ): Promise<TimeBlockSummary> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const created = await tx.timeBlock.create({
        data: {
          id: idGenerator.next(),
          tenantId: ctx.tenantId,
          locationId: timeBlockSchema.locationId,
          staffId: timeBlockSchema.staffId ?? null,
          startsAt: new Date(timeBlockSchema.startsAt),
          endsAt: new Date(timeBlockSchema.endsAt),
          reason: timeBlockSchema.reason,
          rrule: timeBlockSchema.rrule,
        },
      });
      return toTimeBlockSummary(created);
    });
  }
}
