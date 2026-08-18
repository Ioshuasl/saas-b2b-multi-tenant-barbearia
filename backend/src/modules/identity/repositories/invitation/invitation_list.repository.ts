import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { InvitationSummary } from '../../types/user/user_summary.types.js';

export class ListRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext): Promise<InvitationSummary[]> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.invitation.findMany({
        where: { acceptedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      return rows.map((row) => ({
        id: row.id,
        email: row.email,
        role: row.role,
        locationIds: row.locationIds,
        expiresAt: row.expiresAt.toISOString(),
        acceptedAt: row.acceptedAt?.toISOString() ?? null,
        invitedBy: row.invitedBy,
        createdAt: row.createdAt.toISOString(),
      }));
    });
  }
}
