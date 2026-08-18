import type { RequestContext } from '../../../shared/domain/request_context.js';

export function publicCtx(tenantId: string, requestId: string, locationId?: string): RequestContext {
  return {
    tenantId,
    userId: '00000000-0000-0000-0000-000000000000',
    requestId,
    role: 'PUBLIC',
    locationScope: 'ALL',
    locationIds: [],
    locationId,
  };
}
