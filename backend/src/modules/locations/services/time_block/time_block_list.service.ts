import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { findConflictsForTimeBlock } from '../../../scheduling/scheduling_public.js';
import type { ListRepository } from '../../repositories/time_block/time_block_list.repository.js';
import type { TimeBlockSummary } from '../../types/time_block/time_block.types.js';

export class ListService {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(
    ctx: RequestContext,
    filters: { locationId?: string; staffId?: string },
  ): Promise<TimeBlockSummary[]> {
    const rows = await this.listRepository.execute(ctx, filters);
    return Promise.all(rows.map((row) => this.withConflicts(ctx, row)));
  }

  private async withConflicts(
    ctx: RequestContext,
    row: TimeBlockSummary,
  ): Promise<TimeBlockSummary> {
    const conflicts = await findConflictsForTimeBlock({
      tenantId: ctx.tenantId,
      locationId: row.locationId,
      staffId: row.staffId,
      startsAt: new Date(row.startsAt),
      endsAt: new Date(row.endsAt),
    });
    return { ...row, conflicts };
  }
}
