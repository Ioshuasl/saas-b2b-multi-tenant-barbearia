import { AppError, NotFoundError } from '../../../../shared/domain/errors.js';
import { AuditAction, writeAuditLogSafe } from '../../../../shared/database/write_audit.js';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { LastOwnerError } from '../../models/errors/last_owner.error.js';
import { UserRole } from '../../enum/user/user_role.enum.js';
import { UserStatus } from '../../enum/user/user_status.enum.js';
import type { UserUpdateSchema } from '../../schemas/user.schema.js';
import type { RequestMeta } from '../../types/auth/request_meta.types.js';
import type { GetRepository } from '../../repositories/user/user_get.repository.js';
import type { CountActiveOwnersRepository } from '../../repositories/user/user_count_active_owners.repository.js';
import type { UpdateRepository } from '../../repositories/user/user_update.repository.js';
import type { AssertLocationsRepository } from '../../repositories/location/location_assert.repository.js';
import { canAssignRole, requiresLocations } from '../../helpers/role_policy.js';

export class UpdateService {
  constructor(
    private readonly getUser: GetRepository,
    private readonly countOwners: CountActiveOwnersRepository,
    private readonly updateRepository: UpdateRepository,
    private readonly assertLocations: AssertLocationsRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    userId: string,
    userSchema: UserUpdateSchema,
    requestMeta: RequestMeta,
  ): Promise<void> {
    const loaded = await this.getUser.execute(ctx, userId);
    if (!loaded) throw new NotFoundError();
    const current = loaded.user;

    const nextRole = userSchema.role ?? current.props.role;
    if (userSchema.role && !canAssignRole(ctx.role, userSchema.role)) {
      throw new AppError('FORBIDDEN', 'Você não tem permissão para esta ação.', 403);
    }

    const nextActive = userSchema.active ?? current.props.status === UserStatus.ACTIVE;
    const demotingOwner =
      current.isOwner && nextRole !== UserRole.OWNER;
    const disablingOwner = current.isOwner && nextActive === false;
    if (demotingOwner || disablingOwner) {
      const owners = await this.countOwners.execute(ctx);
      if (owners <= 1) throw new LastOwnerError();
    }

    const locationIds = userSchema.locationIds;
    if (requiresLocations(nextRole) && locationIds) {
      if (locationIds.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'Informe ao menos uma unidade.', 400);
      }
      await this.assertLocations.execute(ctx, locationIds);
    }
    if (requiresLocations(nextRole) && demotingOwner && !locationIds) {
      throw new AppError('VALIDATION_ERROR', 'Informe ao menos uma unidade.', 400);
    }

    await this.updateRepository.execute(ctx, userId, {
      role: userSchema.role,
      locationIds,
      active: userSchema.active,
    });

    if (userSchema.role && userSchema.role !== current.props.role) {
      await writeAuditLogSafe({
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId,
        action: AuditAction.ROLE_CHANGED,
        resourceType: 'user',
        resourceId: userId,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        metadata: { from: current.props.role, to: userSchema.role },
      });
    }
  }
}
