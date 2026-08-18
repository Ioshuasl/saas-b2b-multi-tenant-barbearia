import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { DuplicateEmailError } from '../../models/errors/duplicate_email.error.js';
import { InvalidInviteError } from '../../models/errors/invalid_invite.error.js';
import { LeakedPasswordError } from '../../models/errors/leaked_password.error.js';
import type { InvitationAcceptSchema } from '../../schemas/user.schema.js';
import type { LeakedPasswordPort } from '../../types/ports/leaked_password.port.js';
import type { GetByHashRepository } from '../../repositories/invitation/invitation_get_by_hash.repository.js';
import type { AcceptRepository } from '../../repositories/invitation/invitation_accept.repository.js';
import type { GetByEmailRepository } from '../../repositories/user/user_get_by_email.repository.js';
import { hashRefreshToken } from '../../helpers/refresh_token.js';
import { hashPassword } from '../../helpers/password.js';
import { UserRole } from '../../enum/user/user_role.enum.js';

export class AcceptAction {
  constructor(
    private readonly getByHash: GetByHashRepository,
    private readonly getUserByEmail: GetByEmailRepository,
    private readonly acceptRepository: AcceptRepository,
    private readonly leakedPassword: LeakedPasswordPort,
  ) {}

  async execute(invitationAcceptSchema: InvitationAcceptSchema): Promise<RequestContext> {
    const invitation = await this.getByHash.execute(
      hashRefreshToken(invitationAcceptSchema.token),
    );
    if (!invitation || !invitation.isUsable) {
      throw new InvalidInviteError();
    }
    const existing = await this.getUserByEmail.execute(invitation.props.email);
    if (existing) {
      throw new DuplicateEmailError();
    }
    if (await this.leakedPassword.isLeaked(invitationAcceptSchema.password)) {
      throw new LeakedPasswordError();
    }

    const userId = idGenerator.next();
    const ctx: RequestContext = {
      tenantId: invitation.props.tenantId,
      userId,
      requestId: 'invite-accept',
      role: invitation.props.role,
      locationScope: invitation.props.role === UserRole.OWNER ? 'ALL' : 'RESTRICTED',
      locationIds: invitation.props.locationIds,
    };
    await this.acceptRepository.execute(ctx, {
      invitationId: invitation.props.id,
      userId,
      email: invitation.props.email,
      name: invitationAcceptSchema.name,
      passwordHash: await hashPassword(invitationAcceptSchema.password),
      role: invitation.props.role,
      locationIds: invitation.props.locationIds,
    });
    return ctx;
  }
}
