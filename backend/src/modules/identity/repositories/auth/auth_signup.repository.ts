import { Prisma } from '@prisma/client';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { DuplicateEmailError } from '../../models/errors/duplicate_email.error.js';
import { TENANT_CREATED_EVENT } from '../../models/events/tenant_created.event.js';
import { TenantStatus } from '../../enum/tenant/tenant_status.enum.js';
import { UserRole } from '../../enum/user/user_role.enum.js';
import { UserStatus } from '../../enum/user/user_status.enum.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type {
  SignupPersistInput,
  SignupPersistResult,
} from '../../types/auth/auth_signup.types.js';
import { isReservedTenantSlug, withSlugSuffix } from '../../helpers/tenant_slug.js';

export class SignupRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(signupPersist: SignupPersistInput): Promise<SignupPersistResult> {
    try {
      return await this.db.runSignupProvisioning(signupPersist.tenantId, async (tx) => {
        let slug = signupPersist.slug;
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const taken = await tx.tenant.findFirst({ where: { slug } });
          if (!taken && !isReservedTenantSlug(slug)) {
            break;
          }
          slug = withSlugSuffix(signupPersist.slug, idGenerator.next().slice(-4));
        }

        await tx.tenant.create({
          data: {
            id: signupPersist.tenantId,
            name: signupPersist.tenantName,
            slug,
            status: TenantStatus.TRIALING,
            trialEndsAt: signupPersist.trialEndsAt,
          },
        });

        await tx.location.create({
          data: {
            id: signupPersist.locationId,
            tenantId: signupPersist.tenantId,
            slug: 'default',
            name: signupPersist.tenantName,
            phone: signupPersist.phone,
            isDefault: true,
          },
        });

        await tx.user.create({
          data: {
            id: signupPersist.userId,
            tenantId: signupPersist.tenantId,
            email: signupPersist.email,
            passwordHash: signupPersist.passwordHash,
            name: signupPersist.ownerName,
            phone: signupPersist.phone,
            role: UserRole.OWNER,
            status: UserStatus.ACTIVE,
          },
        });

        await tx.tenantCryptoKey.create({
          data: {
            id: signupPersist.cryptoKeyId,
            tenantId: signupPersist.tenantId,
            wrappedDek: signupPersist.wrappedDek,
            status: 'ACTIVE',
          },
        });

        for (const service of signupPersist.services) {
          await tx.service.create({
            data: {
              id: service.id,
              tenantId: signupPersist.tenantId,
              name: service.name,
              durationMinutes: service.durationMinutes,
              priceCents: 0n,
              sortOrder: service.sortOrder,
            },
          });
        }

        for (const hours of signupPersist.businessHours) {
          await tx.businessHours.create({
            data: {
              id: hours.id,
              tenantId: signupPersist.tenantId,
              locationId: signupPersist.locationId,
              weekday: hours.weekday,
              startsAt: hours.startsAt,
              endsAt: hours.endsAt,
            },
          });
        }

        await tx.outboxEvent.create({
          data: {
            id: idGenerator.next(),
            tenantId: signupPersist.tenantId,
            name: TENANT_CREATED_EVENT,
            payload: {
              tenantId: signupPersist.tenantId,
              userId: signupPersist.userId,
              slug,
            },
          },
        });

        return {
          tenantId: signupPersist.tenantId,
          tenantSlug: slug,
          tenantName: signupPersist.tenantName,
          userId: signupPersist.userId,
          email: signupPersist.email,
          name: signupPersist.ownerName,
          role: UserRole.OWNER,
        };
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const fields = uniqueConstraintFields(err.meta?.target);
        if (fields.some((field) => field.includes('email'))) {
          throw new DuplicateEmailError();
        }
      }
      throw err;
    }
  }
}

function uniqueConstraintFields(target: unknown): string[] {
  if (Array.isArray(target)) {
    return target.filter((item): item is string => typeof item === 'string');
  }
  if (typeof target === 'string') return [target];
  return [];
}
