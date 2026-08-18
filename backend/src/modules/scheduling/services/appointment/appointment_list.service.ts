import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { assertLocationInScope, resolveStaffFilter } from '../../helpers/appointment_scope.js';
import type { AppointmentListQuerySchema } from '../../schemas/appointment.schema.js';
import type { AppointmentSummary, AppointmentListFilters } from '../../types/appointment/appointment.types.js';
import type { ListRepository } from '../../repositories/appointment/appointment_list.repository.js';

export class ListService {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(
    ctx: RequestContext,
    query: AppointmentListQuerySchema,
    actorStaffId?: string,
  ): Promise<AppointmentSummary[]> {
    const staffId = resolveStaffFilter(ctx, query.staffId, actorStaffId);

    if (query.locationId) {
      assertLocationInScope(ctx, query.locationId);
    }

    return this.listRepository.execute(ctx, {
      from: query.from,
      to: query.to,
      staffId,
      status: query.status as AppointmentListFilters['status'],
      locationId: query.locationId,
    });
  }
}
