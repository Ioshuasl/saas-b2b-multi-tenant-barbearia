import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { toOnboardingState } from '../../helpers/onboarding_state.js';
import type { OnboardingState } from '../../types/onboarding/onboarding.types.js';
import type { GetRepository } from '../../repositories/onboarding/onboarding_get.repository.js';

export class GetService {
  constructor(private readonly getRepository: GetRepository) {}

  async execute(ctx: RequestContext): Promise<OnboardingState> {
    const record = await this.getRepository.execute(ctx);
    if (!record) throw new NotFoundError();
    return toOnboardingState(record);
  }
}
