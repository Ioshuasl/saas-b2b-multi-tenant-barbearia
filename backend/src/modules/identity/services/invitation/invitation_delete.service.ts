import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { GetRepository } from '../../repositories/invitation/invitation_get.repository.js';
import type { DeleteRepository } from '../../repositories/invitation/invitation_delete.repository.js';

export class DeleteService {
  constructor(
    private readonly getInvitation: GetRepository,
    private readonly deleteRepository: DeleteRepository,
  ) {}

  async execute(ctx: RequestContext, invitationId: string): Promise<void> {
    const invitation = await this.getInvitation.execute(ctx, invitationId);
    if (!invitation || invitation.isAccepted) {
      throw new NotFoundError();
    }
    await this.deleteRepository.execute(ctx, invitationId);
  }
}
