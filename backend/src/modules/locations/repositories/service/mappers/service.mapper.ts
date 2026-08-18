import type { Service } from '@prisma/client';
import type { ServiceSummary } from '../../../types/service/service.types.js';

export function toServiceSummary(row: Service): ServiceSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    durationMinutes: row.durationMinutes,
    bufferMinutes: row.bufferMinutes,
    priceCents: Number(row.priceCents),
    color: row.color,
    active: row.active,
    visibleOnline: row.visibleOnline,
    sortOrder: row.sortOrder,
  };
}
