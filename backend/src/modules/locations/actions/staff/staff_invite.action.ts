import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { inviteMember } from '../../../identity/identity_public.js';
import type { StaffInviteSchema } from '../../schemas/staff.schema.js';
import type { GetRepository } from '../../repositories/staff/staff_get.repository.js';
import type { RequestMeta } from '../../types/request_meta.types.js';

export class InviteAction {
  constructor(private readonly getStaff: GetRepository) {}

  async execute(
    ctx: RequestContext,
    staffId: string,
    staffInviteSchema: StaffInviteSchema,
    requestMeta: RequestMeta,
  ): Promise<{ id: string }> {
    const staff = await this.getStaff.execute(ctx, staffId);
    if (!staff) throw new NotFoundError();
    return inviteMember(
      ctx,
      {
        email: staffInviteSchema.email,
        role: 'STAFF',
        locationIds: staff.locationIds,
      },
      requestMeta,
    );
  }
}
