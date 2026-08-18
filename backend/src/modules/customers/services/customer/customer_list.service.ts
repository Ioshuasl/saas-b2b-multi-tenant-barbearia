import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { CustomerListQuerySchema } from '../../schemas/customer.schema.js';
import type { CustomerListResult } from '../../repositories/customer/customer_list.repository.js';
import type { ListRepository } from '../../repositories/customer/customer_list.repository.js';

export class ListService {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(ctx: RequestContext, query: CustomerListQuerySchema): Promise<CustomerListResult> {
    return this.listRepository.execute(ctx, query);
  }
}
