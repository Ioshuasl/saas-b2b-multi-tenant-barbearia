import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { ListRepository } from '../../repositories/service/service_list.repository.js';
import type { ServiceSummary } from '../../types/service/service.types.js';

export class ListService {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(ctx: RequestContext): Promise<ServiceSummary[]> {
    return this.listRepository.execute(ctx);
  }
}
