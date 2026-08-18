import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { InvitationCreateSchema } from '../../schemas/user.schema.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';
import type { CreateAction } from '../../actions/invitation/invitation_create.action.js';

export class CreateService {
  constructor(private readonly createAction: CreateAction) {}

  async execute(
    ctx: RequestContext,
    invitationSchema: InvitationCreateSchema,
    requestMeta: RequestMeta,
  ): Promise<{ id: string }> {
    return this.createAction.execute(ctx, invitationSchema, requestMeta);
  }
}
