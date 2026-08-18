import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { ListRepository } from '../../repositories/location/location_list.repository.js';
import type { LocationSummary } from '../../types/location/location.types.js';

export class ListService {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(ctx: RequestContext): Promise<LocationSummary[]> {
    return this.listRepository.execute(ctx);
  }
}
