import { AppError } from '../../../../shared/domain/errors.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { DuplicateEmailError } from '../../models/errors/duplicate_email.error.js';
import type { InvitationCreateSchema } from '../../schemas/user.schema.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';
import type { EmailPort } from '../../types/ports/email.port.js';
import type { GetByEmailRepository as GetUserByEmailRepository } from '../../repositories/user/user_get_by_email.repository.js';
import type { GetByEmailRepository as GetInviteByEmailRepository } from '../../repositories/invitation/invitation_get_by_email.repository.js';
import type { CreateRepository } from '../../repositories/invitation/invitation_create.repository.js';
import type { RotateRepository } from '../../repositories/invitation/invitation_rotate.repository.js';
import type { AssertLocationsRepository } from '../../repositories/location/location_assert.repository.js';
import type { GetNameRepository } from '../../repositories/tenant/tenant_get_name.repository.js';
import { canAssignRole, requiresLocations } from '../../helpers/role_policy.js';
import { inviteEmail } from '../../helpers/email_messages.js';
import { sendEmailSafe } from '../../helpers/send_email_safe.js';

export class CreateAction {
  constructor(
    private readonly getUserByEmail: GetUserByEmailRepository,
    private readonly getInviteByEmail: GetInviteByEmailRepository,
    private readonly createRepository: CreateRepository,
    private readonly rotateRepository: RotateRepository,
    private readonly assertLocations: AssertLocationsRepository,
    private readonly getTenantName: GetNameRepository,
    private readonly email: EmailPort,
  ) {}

  async execute(
    ctx: RequestContext,
    invitationSchema: InvitationCreateSchema,
    requestMeta: RequestMeta,
  ): Promise<{ id: string }> {
    if (!canAssignRole(ctx.role, invitationSchema.role)) {
      throw new AppError('FORBIDDEN', 'Você não tem permissão para esta ação.', 403);
    }
    if (requiresLocations(invitationSchema.role) && invitationSchema.locationIds.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Informe ao menos uma unidade.', 400);
    }

    const locationIds = requiresLocations(invitationSchema.role)
      ? invitationSchema.locationIds
      : [];
    await this.assertLocations.execute(ctx, locationIds);

    const existingUser = await this.getUserByEmail.execute(invitationSchema.email);
    if (existingUser) {
      throw new DuplicateEmailError();
    }

    const pending = await this.getInviteByEmail.execute(ctx, invitationSchema.email);
    let invitationId: string;
    let rawToken: string;
    if (pending && !pending.isAccepted) {
      invitationId = pending.props.id;
      rawToken = await this.rotateRepository.execute(ctx, invitationId);
    } else {
      const created = await this.createRepository.execute(ctx, {
        email: invitationSchema.email,
        role: invitationSchema.role,
        locationIds,
        invitedBy: ctx.userId,
      });
      invitationId = created.id;
      rawToken = created.rawToken;
    }

    const tenantName = await this.getTenantName.execute(ctx);
    const message = inviteEmail({ tenantName, token: rawToken });
    await sendEmailSafe(this.email, {
      to: invitationSchema.email,
      ...message,
    });
    await writeAuditLogSafe({
      tenantId: ctx.tenantId,
      actorUserId: ctx.userId,
      action: AuditAction.MEMBER_INVITED,
      resourceType: 'invitation',
      resourceId: invitationId,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      metadata: { email: invitationSchema.email, role: invitationSchema.role },
    });
    return { id: invitationId };
  }
}
