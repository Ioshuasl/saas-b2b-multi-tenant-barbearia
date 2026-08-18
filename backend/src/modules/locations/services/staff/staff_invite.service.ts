import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { InviteAction } from '../../actions/staff/staff_invite.action.js';
import type { StaffInviteSchema } from '../../schemas/staff.schema.js';
import type { RequestMeta } from '../../types/request_meta.types.js';

export class InviteService {
  constructor(private readonly inviteAction: InviteAction) {}

  async execute(
    ctx: RequestContext,
    staffId: string,
    staffInviteSchema: StaffInviteSchema,
    requestMeta: RequestMeta,
  ): Promise<{ id: string }> {
    return this.inviteAction.execute(ctx, staffId, staffInviteSchema, requestMeta);
  }
}
