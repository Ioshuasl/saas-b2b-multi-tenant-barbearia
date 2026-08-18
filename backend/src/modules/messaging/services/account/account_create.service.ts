import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/domain/errors.js';
import type { MessagingAccountConnectResult } from '@repo/contracts';
import type { MessagingAccountCreateSchema } from '../../schemas/account.schema.js';
import type { MessagingProvider } from '../../types/ports/messaging_provider.port.js';
import type { MessagingSessionStatusName } from '../../enum/account/messaging_session_status.enum.js';
import { MessagingSessionStatus } from '../../enum/account/messaging_session_status.enum.js';
import type { UpsertRepository } from '../../repositories/account/account_upsert.repository.js';
import type { UpdateStatusRepository } from '../../repositories/account/account_update_status.repository.js';

export class CreateService {
  constructor(
    private readonly upsertRepository: UpsertRepository,
    private readonly updateStatusRepository: UpdateStatusRepository,
    private readonly messagingProvider: MessagingProvider,
  ) {}

  async execute(
    ctx: RequestContext,
    accountSchema: MessagingAccountCreateSchema,
  ): Promise<MessagingAccountConnectResult> {
    if (!accountSchema.riskAccepted) {
      throw new AppError(
        'RISK_NOT_ACCEPTED',
        'É necessário aceitar os riscos antes de conectar o WhatsApp.',
        422,
        [{ field: 'riskAccepted', issue: 'Confirme a ciência de risco.' }],
      );
    }

    const account = await this.upsertRepository.execute(ctx, {
      riskAcceptedAt: new Date(),
    });

    const session = await this.messagingProvider.startSession(account.sessionName);
    const qrSession = session.qr ? session : await this.messagingProvider.getQr(account.sessionName);

    const updated = await this.updateStatusRepository.execute(ctx, {
      status: (session.status as MessagingSessionStatusName) ?? MessagingSessionStatus.PENDING,
      displayPhone: session.displayPhone ?? null,
    });

    return {
      ...updated,
      qr: qrSession.qr ?? null,
      pairingCode: qrSession.pairingCode ?? null,
    };
  }
}
