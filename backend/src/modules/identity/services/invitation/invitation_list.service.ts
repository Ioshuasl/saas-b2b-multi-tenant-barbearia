import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { InvitationSummary } from '../../types/user/user_summary.types.js';
import type { ListRepository } from '../../repositories/invitation/invitation_list.repository.js';

export class ListService {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(ctx: RequestContext): Promise<InvitationSummary[]> {
    return this.listRepository.execute(ctx);
  }
}
