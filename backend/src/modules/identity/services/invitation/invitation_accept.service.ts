import type { InvitationAcceptSchema } from '../../schemas/user.schema.js';
import type { AcceptAction } from '../../actions/invitation/invitation_accept.action.js';

export class AcceptService {
  constructor(private readonly acceptAction: AcceptAction) {}

  async execute(invitationAcceptSchema: InvitationAcceptSchema): Promise<void> {
    await this.acceptAction.execute(invitationAcceptSchema);
  }
}
