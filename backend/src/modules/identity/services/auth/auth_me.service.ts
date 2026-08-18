import { NotFoundError } from '../../../../shared/domain/errors.js';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { MeResponse } from '../../types/user/user_summary.types.js';
import type { GetMeRepository } from '../../repositories/user/user_get_me.repository.js';

export class MeService {
  constructor(private readonly getMe: GetMeRepository) {}

  async execute(ctx: RequestContext): Promise<MeResponse> {
    const me = await this.getMe.execute(ctx);
    if (!me) throw new NotFoundError();
    return me;
  }
}
