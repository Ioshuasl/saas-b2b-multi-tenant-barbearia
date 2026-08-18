import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { AppointmentHistoryItem } from '../../types/appointment/appointment.types.js';

export class ListRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, appointmentId: string): Promise<AppointmentHistoryItem[]> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.appointmentHistory.findMany({
        where: { appointmentId },
        orderBy: { createdAt: 'desc' },
      });

      return rows.map((row) => ({
        id: row.id,
        action: row.action,
        fromValue: (row.fromValue as Record<string, unknown> | null) ?? null,
        toValue: (row.toValue as Record<string, unknown> | null) ?? null,
        actorId: row.actorId,
        actorType: row.actorType,
        createdAt: row.createdAt.toISOString(),
      }));
    });
  }
}
