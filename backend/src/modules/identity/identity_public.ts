import { AppError } from '../../shared/domain/errors.js';
import type { RequestContext } from '../../shared/domain/request_context.js';
import { getEmailPort } from '../../shared/integrations/email/index.js';
import {
  ROLE_PERMISSIONS,
  type Permission,
} from './enum/user/permission.enum.js';
import type { UserRoleName } from './enum/user/user_role.enum.js';
import { GetActorRepository } from './repositories/user/user_get_actor.repository.js';
import type { Actor } from './types/auth/actor.types.js';
import { CreateService } from './services/invitation/invitation_create.service.js';
import { CreateAction } from './actions/invitation/invitation_create.action.js';
import { GetByEmailRepository } from './repositories/user/user_get_by_email.repository.js';
import { GetByEmailRepository as GetInviteByEmailRepository } from './repositories/invitation/invitation_get_by_email.repository.js';
import { CreateRepository as InviteCreateRepository } from './repositories/invitation/invitation_create.repository.js';
import { RotateRepository as InviteRotateRepository } from './repositories/invitation/invitation_rotate.repository.js';
import { AssertLocationsRepository } from './repositories/location/location_assert.repository.js';
import { GetNameRepository } from './repositories/tenant/tenant_get_name.repository.js';

export type { Permission, Actor };

const getActorRepository = new GetActorRepository();

export async function getActor(userId: string, tenantId: string): Promise<Actor | null> {
  return getActorRepository.execute(
    {
      tenantId,
      userId,
      requestId: 'auth',
      role: 'SYSTEM',
      locationScope: 'ALL',
      locationIds: [],
    },
    userId,
  );
}

export function authorize(ctx: RequestContext, permission: Permission): void {
  const role = ctx.role as UserRoleName;
  const allowed = ROLE_PERMISSIONS[role];
  if (!allowed?.includes(permission)) {
    throw new AppError('FORBIDDEN', 'Você não tem permissão para esta ação.', 403);
  }
}

export function hasPermission(role: string, permission: Permission): boolean {
  const allowed = ROLE_PERMISSIONS[role as UserRoleName];
  return Boolean(allowed?.includes(permission));
}

export type InviteMemberInput = {
  email: string;
  role: UserRoleName;
  locationIds: string[];
};

export type InviteMemberMeta = {
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
};

let inviteService: CreateService | undefined;

function getInviteService(): CreateService {
  if (!inviteService) {
    const email = getEmailPort();
    inviteService = new CreateService(
      new CreateAction(
        new GetByEmailRepository(),
        new GetInviteByEmailRepository(),
        new InviteCreateRepository(),
        new InviteRotateRepository(),
        new AssertLocationsRepository(),
        new GetNameRepository(),
        email,
      ),
    );
  }
  return inviteService;
}

export async function inviteMember(
  ctx: RequestContext,
  invitation: InviteMemberInput,
  requestMeta: InviteMemberMeta,
): Promise<{ id: string }> {
  return getInviteService().execute(ctx, invitation, requestMeta);
}
