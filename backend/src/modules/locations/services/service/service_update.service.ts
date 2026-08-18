import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { UpdateRepository } from '../../repositories/service/service_update.repository.js';
import type { ServiceUpdateSchema } from '../../schemas/service.schema.js';
import type { ServiceSummary } from '../../types/service/service.types.js';

export class UpdateService {
  constructor(private readonly updateRepository: UpdateRepository) {}

  async execute(
    ctx: RequestContext,
    serviceId: string,
    serviceSchema: ServiceUpdateSchema,
  ): Promise<ServiceSummary> {
    const updated = await this.updateRepository.execute(ctx, serviceId, serviceSchema);
    if (!updated) throw new NotFoundError();
    return updated;
  }
}
