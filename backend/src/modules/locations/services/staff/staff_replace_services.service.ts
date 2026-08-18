import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { StaffServicesSchema } from '../../schemas/staff.schema.js';
import type { GetRepository } from '../../repositories/staff/staff_get.repository.js';
import type { ReplaceServicesRepository } from '../../repositories/staff/staff_replace_services.repository.js';
import type { GetRepository as GetServiceRepository } from '../../repositories/service/service_get.repository.js';

export class ReplaceServicesService {
  constructor(
    private readonly getStaff: GetRepository,
    private readonly getService: GetServiceRepository,
    private readonly replaceRepository: ReplaceServicesRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    staffId: string,
    staffServicesSchema: StaffServicesSchema,
  ): Promise<void> {
    const current = await this.getStaff.execute(ctx, staffId);
    if (!current) throw new NotFoundError();
    for (const serviceId of staffServicesSchema.serviceIds) {
      const service = await this.getService.execute(ctx, serviceId);
      if (!service) throw new NotFoundError();
    }
    await this.replaceRepository.execute(ctx, staffId, staffServicesSchema.serviceIds);
  }
}
