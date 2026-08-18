import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import {
  formatTime,
  intersectIntervals,
  isoWeekday,
  parseHhmm,
  rruleMatchesWeekday,
  subtractIntervals,
  zonedLocalToUtc,
  type Interval,
} from '../../helpers/working_windows.js';

export class WorkingWindowsRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(
    ctx: RequestContext,
    input: { locationId: string; staffId?: string; date: string },
  ): Promise<Interval[]> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const location = await tx.location.findUnique({ where: { id: input.locationId } });
      if (!location) return [];

      const locationHours = await tx.businessHours.findMany({
        where: { locationId: input.locationId, staffId: null },
      });
      let staffHours = locationHours;
      if (input.staffId) {
        const own = await tx.businessHours.findMany({
          where: { locationId: input.locationId, staffId: input.staffId },
        });
        if (own.length > 0) staffHours = own;
      }

      const noon = zonedLocalToUtc(input.date, 12, 0, location.timezone);
      const weekday = isoWeekday(noon, location.timezone);

      const toIntervals = (rows: typeof locationHours): Interval[] =>
        rows
          .filter((row) => row.weekday === weekday)
          .map((row) => {
            const start = parseHhmm(formatTime(row.startsAt));
            const end = parseHhmm(formatTime(row.endsAt));
            return {
              startsAt: zonedLocalToUtc(input.date, start.hour, start.minute, location.timezone),
              endsAt: zonedLocalToUtc(input.date, end.hour, end.minute, location.timezone),
            };
          });

      const windows = intersectIntervals(toIntervals(locationHours), toIntervals(staffHours));

      const blocks = await tx.timeBlock.findMany({
        where: {
          locationId: input.locationId,
          OR: [{ staffId: null }, ...(input.staffId ? [{ staffId: input.staffId }] : [])],
        },
      });

      const dayStart = zonedLocalToUtc(input.date, 0, 0, location.timezone);
      const next = nextYmd(input.date);
      const dayEnd = zonedLocalToUtc(next, 0, 0, location.timezone);

      const cuts: Interval[] = [];
      for (const block of blocks) {
        if (block.rrule) {
          if (!rruleMatchesWeekday(block.rrule, weekday)) continue;
          const start = parseHhmm(formatTime(block.startsAt));
          const end = parseHhmm(formatTime(block.endsAt));
          cuts.push({
            startsAt: zonedLocalToUtc(input.date, start.hour, start.minute, location.timezone),
            endsAt: zonedLocalToUtc(input.date, end.hour, end.minute, location.timezone),
          });
          continue;
        }
        const overlapStart = new Date(Math.max(block.startsAt.getTime(), dayStart.getTime()));
        const overlapEnd = new Date(Math.min(block.endsAt.getTime(), dayEnd.getTime()));
        if (overlapEnd > overlapStart) {
          cuts.push({ startsAt: overlapStart, endsAt: overlapEnd });
        }
      }

      return subtractIntervals(windows, cuts);
    });
  }
}

function nextYmd(ymd: string): string {
  const date = new Date(`${ymd}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export type { Interval };
