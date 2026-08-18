import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { isReservedSlug, suggestSlug } from '../../helpers/slug.js';
import type { SlugAvailableRepository } from '../../repositories/tenant/tenant_slug_available.repository.js';

export class SlugAvailableService {
  constructor(private readonly slugAvailable: SlugAvailableRepository) {}

  async execute(
    ctx: RequestContext,
    slug: string,
  ): Promise<{ available: boolean; suggestion?: string }> {
    if (isReservedSlug(slug)) {
      return { available: false, suggestion: suggestSlug(slug) };
    }
    const available = await this.slugAvailable.execute(ctx, slug);
    if (!available) return { available: false, suggestion: suggestSlug(slug) };
    return { available: true };
  }
}
