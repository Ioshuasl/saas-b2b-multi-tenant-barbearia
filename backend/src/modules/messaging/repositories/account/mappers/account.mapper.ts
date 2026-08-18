import type { WhatsappAccount } from '@prisma/client';
import type { MessagingAccountSummary } from '@repo/contracts';
import type { MessagingSessionStatusName } from '../../../enum/account/messaging_session_status.enum.js';

export function toMessagingAccountSummary(row: WhatsappAccount): MessagingAccountSummary {
  return {
    id: row.id,
    tenantId: row.tenantId,
    sessionName: row.sessionName,
    displayPhone: row.displayPhone,
    status: row.status as MessagingSessionStatusName,
    killSwitch: row.killSwitch,
    riskAcceptedAt: row.riskAcceptedAt?.toISOString() ?? null,
    lastError: row.lastError,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function buildSessionName(tenantId: string): string {
  return `tenant_${tenantId.replace(/-/g, '')}`;
}
