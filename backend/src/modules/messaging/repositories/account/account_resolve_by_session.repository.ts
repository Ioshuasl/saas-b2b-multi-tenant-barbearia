import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';
import type { WhatsappAccountLookup } from '../../types/messaging.types.js';

export class ResolveBySessionRepository {
  async execute(sessionName: string): Promise<WhatsappAccountLookup | null> {
    const prisma = getPrismaClient();
    const rows = await prisma.$queryRaw<Array<{ tenant_id: string; account_id: string }>>(
      Prisma.sql`SELECT tenant_id, account_id FROM platform.resolve_whatsapp_account_by_session_name(${sessionName})`,
    );
    const row = rows[0];
    if (!row) return null;
    return { tenantId: row.tenant_id, accountId: row.account_id };
  }
}
