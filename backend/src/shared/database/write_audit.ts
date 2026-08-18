import type { Prisma } from '@prisma/client';
import { idGenerator } from '../helpers/id_generator.js';
import { getTenantPrisma } from './tenant_prisma.js';

export const AuditAction = {
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  LOGOUT_ALL: 'LOGOUT_ALL',
  REFRESH_REUSE: 'REFRESH_REUSE',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  PASSWORD_RESET: 'PASSWORD_RESET',
  MEMBER_INVITED: 'MEMBER_INVITED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  TENANT_UPDATED: 'TENANT_UPDATED',
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
  CUSTOMER_DEACTIVATED: 'CUSTOMER_DEACTIVATED',
  READ: 'READ',
  SEED: 'SEED',
} as const;

export type AuditActionName = (typeof AuditAction)[keyof typeof AuditAction];

export type WriteAuditInput = {
  tenantId: string;
  actorUserId?: string;
  actorType?: 'USER' | 'CUSTOMER' | 'SYSTEM' | 'SUPPORT';
  action: AuditActionName;
  resourceType: string;
  resourceId?: string;
  customerId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function writeAuditLog(input: WriteAuditInput): Promise<void> {
  const tenantPrisma = getTenantPrisma();
  await tenantPrisma.runInTenantContext(
    {
      tenantId: input.tenantId,
      userId: input.actorUserId ?? SYSTEM_USER_ID,
      requestId: 'audit',
      role: 'SYSTEM',
      locationScope: 'ALL',
      locationIds: [],
    },
    async (tx) => {
      await tx.auditLog.create({
        data: {
          id: idGenerator.next(),
          tenantId: input.tenantId,
          actorUserId: input.actorUserId,
          actorType: input.actorType ?? (input.actorUserId ? 'USER' : 'SYSTEM'),
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          customerId: input.customerId,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          metadata:
            input.metadata === undefined
              ? undefined
              : (input.metadata as Prisma.InputJsonValue),
        },
      });
    },
  );
}

export async function writeAuditLogSafe(input: WriteAuditInput): Promise<void> {
  try {
    await writeAuditLog(input);
  } catch {
    // auditoria nunca derruba o fluxo principal
  }
}
