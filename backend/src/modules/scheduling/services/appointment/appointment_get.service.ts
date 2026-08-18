import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { assertLocationInScope, assertStaffAccess } from '../../helpers/appointment_scope.js';
import { unsealAppointmentNotes } from '../../helpers/notes_crypto.js';
import type { AppointmentDetail } from '../../types/appointment/appointment.types.js';
import type { GetRepository } from '../../repositories/appointment/appointment_get.repository.js';

export class GetService {
  constructor(private readonly getRepository: GetRepository) {}

  async execute(
    ctx: RequestContext,
    appointmentId: string,
    actorStaffId?: string,
  ): Promise<AppointmentDetail> {
    const row = await this.getRepository.execute(ctx, appointmentId);
    if (!row) throw new NotFoundError();

    assertLocationInScope(ctx, row.locationId);
    assertStaffAccess(ctx, row.staffId, actorStaffId);

    return {
      ...row,
      notes: await unsealAppointmentNotes(row.notes),
    };
  }
}
