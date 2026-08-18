import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/domain/errors.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { MessagingQrResult } from '@repo/contracts';
import type { MessagingProvider } from '../../types/ports/messaging_provider.port.js';
import type { MessagingSessionStatusName } from '../../enum/account/messaging_session_status.enum.js';
import type { GetRepository } from '../../repositories/account/account_get.repository.js';
import type { UpdateStatusRepository } from '../../repositories/account/account_update_status.repository.js';

export class QrService {
  constructor(
    private readonly getRepository: GetRepository,
    private readonly updateStatusRepository: UpdateStatusRepository,
    private readonly messagingProvider: MessagingProvider,
  ) {}

  async execute(ctx: RequestContext): Promise<MessagingQrResult> {
    const account = await this.getRepository.execute(ctx);
    if (!account) {
      throw new NotFoundError('Conta de mensagens não configurada.');
    }
    if (!account.riskAcceptedAt) {
      throw new AppError(
        'RISK_NOT_ACCEPTED',
        'É necessário aceitar os riscos antes de obter o QR.',
        422,
      );
    }

    const session = await this.messagingProvider.getQr(account.sessionName);

    if (session.status !== account.status || session.displayPhone !== account.displayPhone) {
      await this.updateStatusRepository.execute(ctx, {
        status: session.status as MessagingSessionStatusName,
        displayPhone: session.displayPhone ?? null,
      });
    }

    return {
      status: session.status as MessagingSessionStatusName,
      displayPhone: session.displayPhone ?? null,
      qr: session.qr ?? null,
      pairingCode: session.pairingCode ?? null,
    };
  }
}
