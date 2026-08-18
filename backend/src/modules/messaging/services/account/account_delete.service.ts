import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { MessagingAccountSummary } from '@repo/contracts';
import type { MessagingProvider } from '../../types/ports/messaging_provider.port.js';
import type { GetRepository } from '../../repositories/account/account_get.repository.js';
import type { DisconnectRepository } from '../../repositories/account/account_disconnect.repository.js';

export class DeleteService {
  constructor(
    private readonly getRepository: GetRepository,
    private readonly disconnectRepository: DisconnectRepository,
    private readonly messagingProvider: MessagingProvider,
  ) {}

  async execute(ctx: RequestContext): Promise<MessagingAccountSummary> {
    const account = await this.getRepository.execute(ctx);
    if (!account) {
      throw new NotFoundError('Conta de mensagens não configurada.');
    }

    await this.messagingProvider.logout(account.sessionName);
    return this.disconnectRepository.execute(ctx);
  }
}
