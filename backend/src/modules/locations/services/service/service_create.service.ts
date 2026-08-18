import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { CreateRepository } from '../../repositories/service/service_create.repository.js';
import type { ServiceCreateSchema } from '../../schemas/service.schema.js';
import type { ServiceSummary } from '../../types/service/service.types.js';

export class CreateService {
  constructor(private readonly createRepository: CreateRepository) {}

  async execute(ctx: RequestContext, serviceSchema: ServiceCreateSchema): Promise<ServiceSummary> {
    return this.createRepository.execute(ctx, serviceSchema);
  }
}
