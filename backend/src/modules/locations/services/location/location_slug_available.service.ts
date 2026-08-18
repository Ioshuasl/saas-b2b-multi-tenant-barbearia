import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { isReservedSlug, suggestSlug } from '../../helpers/slug.js';
import type { GetBySlugRepository } from '../../repositories/location/location_get_by_slug.repository.js';

export class SlugAvailableService {
  constructor(private readonly getBySlug: GetBySlugRepository) {}

  async execute(
    ctx: RequestContext,
    slug: string,
    exceptId?: string,
  ): Promise<{ available: boolean; suggestion?: string }> {
    if (isReservedSlug(slug)) {
      return { available: false, suggestion: suggestSlug(slug) };
    }
    const taken = await this.getBySlug.execute(ctx, slug, exceptId);
    if (taken) return { available: false, suggestion: suggestSlug(slug) };
    return { available: true };
  }
}
