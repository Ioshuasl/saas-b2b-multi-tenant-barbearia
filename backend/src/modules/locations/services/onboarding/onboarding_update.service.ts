import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { parseStored, toOnboardingState } from '../../helpers/onboarding_state.js';
import type { OnboardingUpdateSchema } from '../../schemas/onboarding.schema.js';
import type { OnboardingState } from '../../types/onboarding/onboarding.types.js';
import type { GetRepository } from '../../repositories/onboarding/onboarding_get.repository.js';
import type { UpdateRepository } from '../../repositories/onboarding/onboarding_update.repository.js';

export class UpdateService {
  constructor(
    private readonly getRepository: GetRepository,
    private readonly updateRepository: UpdateRepository,
  ) {}

  async execute(
    ctx: RequestContext,
    onboardingSchema: OnboardingUpdateSchema,
  ): Promise<OnboardingState> {
    const current = await this.getRepository.execute(ctx);
    if (!current) throw new NotFoundError();
    const state = parseStored(current.onboarding);

    if (onboardingSchema.step === 'publish') {
      state.publishedAt = new Date().toISOString();
    } else if (!state.completedSteps.includes(onboardingSchema.step)) {
      state.completedSteps.push(onboardingSchema.step);
    }

    const updated = await this.updateRepository.execute(ctx, state);
    if (!updated) throw new NotFoundError();
    return toOnboardingState(updated);
  }
}
