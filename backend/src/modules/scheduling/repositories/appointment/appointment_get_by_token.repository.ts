import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export type AppointmentTokenRow = {
  id: string;
  tenantId: string;
  locationId: string;
  customerId: string;
  staffId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  cancelTokenHash: string | null;
  totalPriceCents: bigint;
};

export class GetByTokenRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    appointmentId: string,
    locationId: string,
  ): Promise<AppointmentTokenRow | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.appointment.findFirst({
        where: { id: appointmentId, locationId },
        select: {
          id: true,
          tenantId: true,
          locationId: true,
          customerId: true,
          staffId: true,
          startsAt: true,
          endsAt: true,
          status: true,
          cancelTokenHash: true,
          totalPriceCents: true,
        },
      });
      return row;
    });
  }
}
