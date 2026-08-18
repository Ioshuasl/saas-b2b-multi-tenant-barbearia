import { createHash } from 'node:crypto';

export type TimeInterval = { startsAt: Date; endsAt: Date };

export function hashRequestBody(body: unknown): string {
  return createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

export function splitIntoSlots(windows: TimeInterval[], durationMinutes: number): TimeInterval[] {
  const durationMs = durationMinutes * 60_000;
  const slots: TimeInterval[] = [];

  for (const window of windows) {
    let cursor = window.startsAt.getTime();
    const windowEnd = window.endsAt.getTime();
    while (cursor + durationMs <= windowEnd) {
      slots.push({
        startsAt: new Date(cursor),
        endsAt: new Date(cursor + durationMs),
      });
      cursor += durationMs;
    }
  }

  return slots;
}

export function slotIsFree(slot: TimeInterval, booked: TimeInterval[]): boolean {
  for (const existing of booked) {
    if (existing.endsAt <= slot.startsAt || existing.startsAt >= slot.endsAt) continue;
    return false;
  }
  return true;
}

export function intervalsOverlap(a: TimeInterval, b: TimeInterval): boolean {
  return a.endsAt > b.startsAt && a.startsAt < b.endsAt;
}

export function enumerateDates(fromYmd: string, toYmd: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${fromYmd}T00:00:00.000Z`);
  const end = new Date(`${toYmd}T00:00:00.000Z`);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}
