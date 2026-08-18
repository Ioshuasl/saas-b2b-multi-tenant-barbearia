import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';

export class MarkProcessedRepository {
  constructor(private readonly prisma = getPrismaClient()) {}

  async execute(outboxEventId: string): Promise<void> {
    await this.prisma.$executeRaw(
      Prisma.sql`SELECT platform.mark_outbox_processed(${outboxEventId}::uuid)`,
    );
  }
}

export class MarkFailedRepository {
  constructor(private readonly prisma = getPrismaClient()) {}

  async execute(outboxEventId: string, error: string, maxAttempts: number): Promise<void> {
    await this.prisma.$executeRaw(
      Prisma.sql`SELECT platform.mark_outbox_failed(${outboxEventId}::uuid, ${error}, ${maxAttempts}::smallint)`,
    );
  }
}
