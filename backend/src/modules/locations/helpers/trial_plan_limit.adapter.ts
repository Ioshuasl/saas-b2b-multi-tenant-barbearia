import type { PlanLimitPort } from '../types/ports/plan_limit.port.js';

/** S1: trial ilimitado. S7 liga limites reais. */
export class TrialPlanLimitAdapter implements PlanLimitPort {
  async assertCanCreate(_tenantId: string, _kind: 'location' | 'staff'): Promise<void> {
    return;
  }
}
