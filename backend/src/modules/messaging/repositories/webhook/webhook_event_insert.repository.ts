import { getPrismaClient } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { WahaWebhookPayload } from '../../types/messaging.types.js';

export class InsertWebhookEventRepository {
  constructor(private readonly prisma = getPrismaClient()) {}

  /** Retorna false se o evento já foi processado (idempotência). */
  async execute(provider: string, providerEventId: string, payload: WahaWebhookPayload): Promise<boolean> {
    try {
      await this.prisma.webhookEvent.create({
        data: {
          id: idGenerator.next(),
          provider,
          providerEventId,
          payload: payload as object,
          processedAt: new Date(),
        },
      });
      return true;
    } catch (err) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        return false;
      }
      throw err;
    }
  }
}
