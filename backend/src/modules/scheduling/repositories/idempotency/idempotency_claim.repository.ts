import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/domain/errors.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

const TTL_MS = 24 * 60 * 60 * 1000;

export type IdempotencyRecord = {
  responseStatus: number;
  responseBody: unknown;
};

export class ClaimRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async findValid(
    ctx: RequestContext,
    key: string,
    route: string,
    requestHash: string,
  ): Promise<IdempotencyRecord | 'conflict' | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const row = await tx.idempotencyKey.findUnique({
        where: { tenantId_key: { tenantId: ctx.tenantId, key } },
      });
      if (!row) return null;

      const age = Date.now() - row.createdAt.getTime();
      if (age > TTL_MS) return null;

      if (row.route !== route || row.requestHash !== requestHash) {
        return 'conflict';
      }

      return {
        responseStatus: row.responseStatus,
        responseBody: row.responseBody,
      };
    });
  }

  async save(
    ctx: RequestContext,
    input: {
      key: string;
      route: string;
      requestHash: string;
      responseStatus: number;
      responseBody: unknown;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const write = async (client: Prisma.TransactionClient) => {
      await client.idempotencyKey.create({
        data: {
          tenantId: ctx.tenantId,
          key: input.key,
          route: input.route,
          requestHash: input.requestHash,
          responseStatus: input.responseStatus,
          responseBody: input.responseBody as Prisma.InputJsonValue,
        },
      });
    };

    if (tx) {
      await write(tx);
      return;
    }

    await this.db.runInTenantContext(ctx, write);
  }
}

export function requireIdempotencyKey(header: string | undefined): string {
  const key = header?.trim();
  if (!key) {
    throw new AppError('VALIDATION_ERROR', 'Header Idempotency-Key é obrigatório.', 400);
  }
  return key;
}

export function idempotencyConflictError(): AppError {
  return new AppError(
    'IDEMPOTENCY_KEY_REUSED',
    'Idempotency-Key já utilizada com payload diferente.',
    409,
  );
}
