import { NotFoundError } from '../../../shared/domain/errors.js';
import { getServiceSnapshot } from '../../locations/locations_public.js';
import type { ServiceSnapshotLine } from '../types/appointment/appointment.types.js';

export async function resolveServiceSnapshots(input: {
  tenantId: string;
  locationId: string;
  serviceIds: readonly string[];
}): Promise<ServiceSnapshotLine[]> {
  if (input.serviceIds.length === 0) {
    throw new NotFoundError();
  }

  const lines: ServiceSnapshotLine[] = [];
  for (const serviceId of input.serviceIds) {
    const snapshot = await getServiceSnapshot(input.tenantId, input.locationId, serviceId);
    if (!snapshot) {
      throw new NotFoundError();
    }
    lines.push({
      serviceId,
      priceCents: BigInt(snapshot.priceCents),
      durationMinutes: snapshot.durationMinutes,
    });
  }
  return lines;
}
