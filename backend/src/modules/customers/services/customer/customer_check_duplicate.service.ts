import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { CustomerDuplicateQuerySchema } from '../../schemas/customer.schema.js';
import type { CustomerDuplicateCheck } from '../../types/customer/customer.types.js';
import type { GetByPhoneRepository } from '../../repositories/customer/customer_get_by_phone.repository.js';

export class CheckDuplicateService {
  constructor(private readonly getByPhoneRepository: GetByPhoneRepository) {}

  async execute(
    ctx: RequestContext,
    query: CustomerDuplicateQuerySchema,
  ): Promise<CustomerDuplicateCheck> {
    const existing = await this.getByPhoneRepository.execute(ctx, query.phone);
    if (!existing) return { exists: false };
    return { exists: true, customerId: existing.id };
  }
}
