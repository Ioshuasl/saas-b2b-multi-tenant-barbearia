import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { timeFromHhmm } from '../../helpers/working_windows.js';
import type { BusinessHoursView } from '../../types/business_hours/business_hours.types.js';

export class ReplaceRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    locationId: string,
    staffId: string | null,
    slots: Array<{ weekday: number; startsAt: string; endsAt: string }>,
  ): Promise<BusinessHoursView> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      await tx.businessHours.deleteMany({
        where: staffId ? { locationId, staffId } : { locationId, staffId: null },
      });
      for (const slot of slots) {
        await tx.businessHours.create({
          data: {
            id: idGenerator.next(),
            tenantId: ctx.tenantId,
            locationId,
            staffId,
            weekday: slot.weekday,
            startsAt: timeFromHhmm(slot.startsAt),
            endsAt: timeFromHhmm(slot.endsAt),
          },
        });
      }
      return { locationId, staffId, slots };
    });
  }
}
