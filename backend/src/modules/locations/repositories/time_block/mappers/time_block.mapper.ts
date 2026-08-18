import type { TimeBlock } from '@prisma/client';
import type { TimeBlockSummary } from '../../../types/time_block/time_block.types.js';

export function toTimeBlockSummary(row: TimeBlock): TimeBlockSummary {
  return {
    id: row.id,
    locationId: row.locationId,
    staffId: row.staffId,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    reason: row.reason,
    rrule: row.rrule,
    conflicts: [],
  };
}
