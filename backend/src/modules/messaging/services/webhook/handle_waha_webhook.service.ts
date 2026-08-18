import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/domain/errors.js';
import { logger } from '../../../../shared/config/logger.js';
import type { MessagingSessionStatusName } from '../../enum/account/messaging_session_status.enum.js';
import { MessagingSessionStatus } from '../../enum/account/messaging_session_status.enum.js';
import type { ResolveBySessionRepository } from '../../repositories/account/account_resolve_by_session.repository.js';
import type { UpdateStatusRepository } from '../../repositories/account/account_update_status.repository.js';
import type { InsertWebhookEventRepository } from '../../repositories/webhook/webhook_event_insert.repository.js';
import { buildWebhookEventId, mapWahaSessionStatus, verifyWahaWebhookHmac } from '../../helpers/waha_webhook.js';
import type { WahaWebhookPayload } from '../../types/messaging.types.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export class HandleWahaWebhookService {
  constructor(
    private readonly resolveBySessionRepository: ResolveBySessionRepository,
    private readonly insertWebhookEventRepository: InsertWebhookEventRepository,
    private readonly updateStatusRepository: UpdateStatusRepository,
    private readonly db = getTenantPrisma(),
  ) {}

  async execute(rawBody: Buffer, signatureHeader: string | undefined): Promise<void> {
    if (!verifyWahaWebhookHmac(rawBody, signatureHeader)) {
      throw new AppError('WEBHOOK_UNAUTHORIZED', 'Assinatura HMAC inválida.', 401);
    }

    let payload: WahaWebhookPayload;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as WahaWebhookPayload;
    } catch {
      throw new AppError('VALIDATION_ERROR', 'Payload JSON inválido.', 400);
    }

    const providerEventId = buildWebhookEventId(payload);
    const isNew = await this.insertWebhookEventRepository.execute('waha', providerEventId, payload);
    if (!isNew) {
      logger.info({ providerEventId }, 'waha_webhook_duplicate');
      return;
    }

    const sessionName = payload.session;
    if (!sessionName) return;

    const lookup = await this.resolveBySessionRepository.execute(sessionName);
    if (!lookup) {
      logger.warn({ sessionName }, 'waha_webhook_unknown_session');
      return;
    }

    const ctx: RequestContext = {
      tenantId: lookup.tenantId,
      userId: lookup.accountId,
      requestId: `webhook-${providerEventId}`,
      role: 'OWNER',
      locationScope: 'ALL',
      locationIds: [],
    };

    if (payload.event === 'session.status') {
      const wahaStatus =
        typeof payload.payload?.status === 'string' ? payload.payload.status : 'PENDING';
      const status = mapWahaSessionStatus(wahaStatus) as MessagingSessionStatusName;
      const me = payload.payload?.me as { id?: string } | undefined;
      const phone = typeof me?.id === 'string' ? me.id.replace('@c.us', '') : null;

      await this.updateStatusRepository.execute(ctx, {
        status,
        displayPhone: phone ? `+${phone}` : status === MessagingSessionStatus.CONNECTED ? undefined : null,
        lastError:
          status === MessagingSessionStatus.ERROR
            ? String(payload.payload?.status ?? 'session_error')
            : null,
      });
      return;
    }

    if (payload.event === 'message.ack') {
      const providerMessageId =
        typeof payload.payload?.id === 'string' ? payload.payload.id : undefined;
      const ack =
        typeof payload.payload?.ack === 'number'
          ? payload.payload.ack
          : typeof payload.payload?.ackName === 'string'
            ? payload.payload.ackName
            : undefined;

      if (!providerMessageId) return;

      await this.db.runInTenantContext(ctx, async (tx) => {
        const ackSent =
          ack === 2 ||
          ack === 3 ||
          ack === 'SERVER_ACK' ||
          ack === 'DEVICE_ACK' ||
          ack === 'READ' ||
          ack === 'PLAYED';

        await tx.notification.updateMany({
          where: { providerMessageId },
          data: ackSent
            ? { status: 'SENT', sentAt: new Date() }
            : { status: 'FAILED', error: String(ack ?? 'ack_failed') },
        });
      });
    }
  }
}
