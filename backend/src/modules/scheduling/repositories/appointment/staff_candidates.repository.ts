import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export type StaffCandidate = {
  id: string;
  name: string;
};

export class StaffCandidatesRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    input: { locationId: string; serviceIds: readonly string[]; staffId?: string },
  ): Promise<StaffCandidate[]> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      if (input.staffId) {
        const row = await tx.staff.findFirst({
          where: {
            id: input.staffId,
            deletedAt: null,
            active: true,
            staffLocations: { some: { locationId: input.locationId } },
          },
          select: { id: true, name: true, staffServices: { select: { serviceId: true } } },
        });
        if (!row || !staffExecutesServices(row.staffServices.map((s) => s.serviceId), input.serviceIds)) {
          return [];
        }
        return [{ id: row.id, name: row.name }];
      }

      const rows = await tx.staff.findMany({
        where: {
          deletedAt: null,
          active: true,
          staffLocations: { some: { locationId: input.locationId } },
        },
        include: { staffServices: { select: { serviceId: true } } },
        orderBy: { name: 'asc' },
      });

      return rows
        .filter((row) =>
          staffExecutesServices(
            row.staffServices.map((s) => s.serviceId),
            input.serviceIds,
          ),
        )
        .map((row) => ({ id: row.id, name: row.name }));
    });
  }
}

function staffExecutesServices(assigned: string[], required: readonly string[]): boolean {
  if (assigned.length === 0) return true;
  return required.every((serviceId) => assigned.includes(serviceId));
}
