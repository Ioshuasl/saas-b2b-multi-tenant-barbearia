export type PlanLimitKind = 'location' | 'staff';

export type PlanLimitPort = {
  assertCanCreate(tenantId: string, kind: PlanLimitKind): Promise<void>;
};
