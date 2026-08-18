import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { MessagingAccountSummary } from '@repo/contracts';
import type { GetRepository } from '../../repositories/account/account_get.repository.js';

export class GetService {
  constructor(private readonly getRepository: GetRepository) {}

  async execute(ctx: RequestContext): Promise<MessagingAccountSummary> {
    const account = await this.getRepository.execute(ctx);
    if (!account) {
      throw new NotFoundError('Conta de mensagens não configurada.');
    }
    return account;
  }
}
