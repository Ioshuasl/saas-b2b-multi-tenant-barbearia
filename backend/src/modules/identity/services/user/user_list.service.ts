import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { UserSummary } from '../../types/user/user_summary.types.js';
import type { ListRepository } from '../../repositories/user/user_list.repository.js';

export class ListService {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(ctx: RequestContext): Promise<UserSummary[]> {
    return this.listRepository.execute(ctx);
  }
}
