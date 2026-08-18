import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { getKeyManagement } from '../../../../shared/crypto/index.js';
import type { AuthSignupSchema } from '../../schemas/auth.schema.js';
import type { SignupRepository } from '../../repositories/auth/auth_signup.repository.js';
import type { SignupPersistResult } from '../../types/auth/auth_signup.types.js';
import { SIGNUP_HOURS_WEEKDAYS, SIGNUP_SERVICES, signupHourRange } from '../../helpers/signup_seeds.js';
import { slugifyTenantName } from '../../helpers/tenant_slug.js';

const TRIAL_DAYS = 14;

export class SignupAction {
  constructor(private readonly signupRepository: SignupRepository) {}

  async execute(
    authSignupSchema: AuthSignupSchema,
    passwordHash: string,
  ): Promise<SignupPersistResult> {
    const tenantId = idGenerator.next();
    const locationId = idGenerator.next();
    const userId = idGenerator.next();
    const kms = getKeyManagement();
    const wrappedDek = await kms.wrapDek(kms.generateDek());
    const hours = signupHourRange();

    return this.signupRepository.execute({
      tenantId,
      tenantName: authSignupSchema.tenantName,
      slug: slugifyTenantName(authSignupSchema.tenantName),
      trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
      locationId,
      userId,
      email: authSignupSchema.email,
      passwordHash,
      ownerName: authSignupSchema.tenantName,
      phone: authSignupSchema.phone,
      wrappedDek,
      cryptoKeyId: idGenerator.next(),
      services: SIGNUP_SERVICES.map((service) => ({
        id: idGenerator.next(),
        name: service.name,
        durationMinutes: service.durationMinutes,
        sortOrder: service.sortOrder,
      })),
      businessHours: SIGNUP_HOURS_WEEKDAYS.map((weekday) => ({
        id: idGenerator.next(),
        weekday,
        startsAt: hours.startsAt,
        endsAt: hours.endsAt,
      })),
    });
  }
}
