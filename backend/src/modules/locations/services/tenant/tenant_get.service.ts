import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { GetRepository } from '../../repositories/tenant/tenant_get.repository.js';
import type { TenantSummary } from '../../types/tenant/tenant.types.js';

export class GetService {
  constructor(private readonly getRepository: GetRepository) {}

  async execute(ctx: RequestContext): Promise<TenantSummary> {
    const tenant = await this.getRepository.execute(ctx);
    if (!tenant) throw new NotFoundError();
    return tenant;
  }
}
