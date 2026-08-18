export type LocationScope = 'ALL' | 'RESTRICTED';

export type RequestContext = {
  tenantId: string;
  userId: string;
  requestId: string;
  role: string;
  locationId?: string;
  locationScope: LocationScope;
  locationIds: readonly string[];
};
