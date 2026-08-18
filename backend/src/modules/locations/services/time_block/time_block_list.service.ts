import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { ListRepository } from '../../repositories/time_block/time_block_list.repository.js';
import type { TimeBlockSummary } from '../../types/time_block/time_block.types.js';

export class ListService {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(
    ctx: RequestContext,
    filters: { locationId?: string; staffId?: string },
  ): Promise<TimeBlockSummary[]> {
    return this.listRepository.execute(ctx, filters);
  }
}
