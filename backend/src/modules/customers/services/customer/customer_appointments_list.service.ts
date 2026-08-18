import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { listAppointmentsByCustomer } from '../../../scheduling/scheduling_public.js';
import type { CustomerAppointmentsResult } from '../../types/customer/customer.types.js';
import type { GetRepository } from '../../repositories/customer/customer_get.repository.js';

export class AppointmentsListService {
  constructor(private readonly getRepository: GetRepository) {}

  async execute(ctx: RequestContext, customerId: string): Promise<CustomerAppointmentsResult> {
    const customer = await this.getRepository.execute(ctx, customerId);
    if (!customer) throw new NotFoundError();
    return listAppointmentsByCustomer(ctx.tenantId, customerId);
  }
}
