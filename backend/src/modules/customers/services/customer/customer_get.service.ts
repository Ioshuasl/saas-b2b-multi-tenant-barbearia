import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { unsealCustomerNotes } from '../../helpers/notes_crypto.js';
import type { CustomerDetail } from '../../types/customer/customer.types.js';
import type { GetRepository } from '../../repositories/customer/customer_get.repository.js';

export class GetService {
  constructor(private readonly getRepository: GetRepository) {}

  async execute(ctx: RequestContext, customerId: string): Promise<CustomerDetail> {
    const row = await this.getRepository.execute(ctx, customerId);
    if (!row) throw new NotFoundError();
    const notes = row.notes ? await unsealCustomerNotes(row.notes) : null;
    return { ...row, notes };
  }

  async executeSummary(
    ctx: RequestContext,
    customerId: string,
  ): Promise<{ name: string; phone: string } | null> {
    const row = await this.getRepository.execute(ctx, customerId);
    if (!row) return null;
    return { name: row.name, phone: row.phone };
  }
}
