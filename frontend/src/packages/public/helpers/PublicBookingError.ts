import { ApiClientError } from '@/shared/api/api-client';

export function suggestedSlotsFromError(err: unknown): string[] {
  if (!(err instanceof ApiClientError) || !Array.isArray(err.details)) return [];
  for (const item of err.details) {
    if (!item || typeof item !== 'object' || !('suggestedSlots' in item)) continue;
    const slots = (item as { suggestedSlots?: unknown }).suggestedSlots;
    if (!Array.isArray(slots)) continue;
    return slots.filter((slot): slot is string => typeof slot === 'string');
  }
  return [];
}
