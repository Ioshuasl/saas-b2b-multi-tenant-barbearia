import { NotFoundError } from '../../../../shared/domain/errors.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';
import type { EmailPort } from '../../types/ports/email.port.js';
import type { GetRepository } from '../../repositories/invitation/invitation_get.repository.js';
import type { RotateRepository } from '../../repositories/invitation/invitation_rotate.repository.js';
import type { GetNameRepository } from '../../repositories/tenant/tenant_get_name.repository.js';
import { inviteEmail } from '../../helpers/email_messages.js';
import { sendEmailSafe } from '../../helpers/send_email_safe.js';

export class ResendAction {
  constructor(
    private readonly getInvitation: GetRepository,
    private readonly rotateRepository: RotateRepository,
    private readonly getTenantName: GetNameRepository,
    private readonly email: EmailPort,
  ) {}

  async execute(
    ctx: RequestContext,
    invitationId: string,
    requestMeta: RequestMeta,
  ): Promise<void> {
    const invitation = await this.getInvitation.execute(ctx, invitationId);
    if (!invitation || invitation.isAccepted) {
      throw new NotFoundError();
    }
    const rawToken = await this.rotateRepository.execute(ctx, invitationId);
    const tenantName = await this.getTenantName.execute(ctx);
    const message = inviteEmail({ tenantName, token: rawToken });
    await sendEmailSafe(this.email, { to: invitation.props.email, ...message });
    await writeAuditLogSafe({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: AuditAction.MEMBER_INVITED,
      resourceType: 'invitation',
      resourceId: invitationId,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      metadata: { resend: true },
    });
  }
}
