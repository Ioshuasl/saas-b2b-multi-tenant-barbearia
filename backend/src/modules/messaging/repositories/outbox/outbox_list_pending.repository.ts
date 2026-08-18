import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';

export type PendingOutboxRow = {
  id: string;
  tenantId: string;
  name: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  attempts: number;
  lastError: string | null;
};

export class ListPendingRepository {
  constructor(private readonly prisma = getPrismaClient()) {}

  async execute(limit = 50): Promise<PendingOutboxRow[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        tenant_id: string;
        name: string;
        payload: unknown;
        occurred_at: Date;
        attempts: number;
        last_error: string | null;
      }>
    >(Prisma.sql`SELECT * FROM platform.list_pending_outbox_events(${limit}::integer)`);

    return rows.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      payload: row.payload as Record<string, unknown>,
      occurredAt: row.occurred_at,
      attempts: row.attempts,
      lastError: row.last_error,
    }));
  }
}
