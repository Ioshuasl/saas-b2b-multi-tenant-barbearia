import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { ListRepository } from '../../repositories/staff/staff_list.repository.js';
import type { StaffSummary } from '../../types/staff/staff.types.js';

export class ListService {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(ctx: RequestContext): Promise<StaffSummary[]> {
    return this.listRepository.execute(ctx);
  }
}
