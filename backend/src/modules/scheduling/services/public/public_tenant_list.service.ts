import type { ScopeService } from './public_scope.service.js';

export class TenantListService {
  constructor(private readonly scope: ScopeService) {}

  async execute(tenantSlug: string, requestId: string) {
    const { tenant } = await this.scope.resolveTenant(tenantSlug, requestId);
    return tenant;
  }
}
