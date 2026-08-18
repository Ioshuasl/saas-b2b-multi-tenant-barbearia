import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { DeleteRepository } from '../../repositories/time_block/time_block_delete.repository.js';

export class DeleteService {
  constructor(private readonly deleteRepository: DeleteRepository) {}

  async execute(ctx: RequestContext, timeBlockId: string): Promise<void> {
    const deleted = await this.deleteRepository.execute(ctx, timeBlockId);
    if (!deleted) throw new NotFoundError();
  }
}
