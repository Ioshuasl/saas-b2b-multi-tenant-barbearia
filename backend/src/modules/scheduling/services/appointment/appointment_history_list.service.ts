import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { assertLocationInScope, assertStaffAccess } from '../../helpers/appointment_scope.js';
import type { AppointmentHistoryItem } from '../../types/appointment/appointment.types.js';
import type { GetRepository } from '../../repositories/appointment/appointment_get.repository.js';
import type { ListRepository } from '../../repositories/appointment_history/history_list.repository.js';

export class HistoryListService {
  constructor(
    private readonly getRepository: GetRepository,
    private readonly listRepository: ListRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    appointmentId: string,
    actorStaffId?: string,
  ): Promise<AppointmentHistoryItem[]> {
    const current = await this.getRepository.execute(ctx, appointmentId);
    if (!current) throw new NotFoundError();

    assertLocationInScope(ctx, current.locationId);
    assertStaffAccess(ctx, current.staffId, actorStaffId);

    return this.listRepository.execute(ctx, appointmentId);
  }
}
