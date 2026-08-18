export function parseHhmm(value: string): { hour: number; minute: number } {
  const [hourRaw, minuteRaw] = value.split(':');
  return { hour: Number(hourRaw), minute: Number(minuteRaw) };
}

export function formatTime(value: Date): string {
  return value.toISOString().slice(11, 16);
}

export function timeFromHhmm(value: string): Date {
  const { hour, minute } = parseHhmm(value);
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0));
}

export function isoWeekday(date: Date, timeZone: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return map[weekday] ?? 1;
}

export function ymdInZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

/** Converte data civil + hora de parede no fuso IANA para UTC. */
export function zonedLocalToUtc(
  ymd: string,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const utcGuess = Date.parse(`${ymd}T${pad(hour)}:${pad(minute)}:00.000Z`);
  const instant = new Date(utcGuess);
  const asZone = zonedParts(instant, timeZone);
  const wanted = `${ymd}T${pad(hour)}:${pad(minute)}`;
  const got = `${asZone.ymd}T${pad(asZone.hour)}:${pad(asZone.minute)}`;
  const delta = Date.parse(`${wanted}:00.000Z`) - Date.parse(`${got}:00.000Z`);
  return new Date(utcGuess + delta);
}

function zonedParts(date: Date, timeZone: string): { ymd: string; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '0';
  return {
    ymd: `${get('year')}-${get('month')}-${get('day')}`,
    hour: Number(get('hour')),
    minute: Number(get('minute')),
  };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export type Interval = { startsAt: Date; endsAt: Date };

export function intersectIntervals(a: Interval[], b: Interval[]): Interval[] {
  const out: Interval[] = [];
  for (const left of a) {
    for (const right of b) {
      const startsAt = new Date(Math.max(left.startsAt.getTime(), right.startsAt.getTime()));
      const endsAt = new Date(Math.min(left.endsAt.getTime(), right.endsAt.getTime()));
      if (endsAt.getTime() > startsAt.getTime()) {
        out.push({ startsAt, endsAt });
      }
    }
  }
  return out;
}

export function subtractIntervals(base: Interval[], cuts: Interval[]): Interval[] {
  let current = [...base];
  for (const cut of cuts) {
    const next: Interval[] = [];
    for (const slot of current) {
      if (cut.endsAt <= slot.startsAt || cut.startsAt >= slot.endsAt) {
        next.push(slot);
        continue;
      }
      if (cut.startsAt > slot.startsAt) {
        next.push({ startsAt: slot.startsAt, endsAt: cut.startsAt });
      }
      if (cut.endsAt < slot.endsAt) {
        next.push({ startsAt: cut.endsAt, endsAt: slot.endsAt });
      }
    }
    current = next;
  }
  return current;
}

const BYDAY: Record<string, number> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 7,
};

export function rruleMatchesWeekday(rrule: string | null, weekday: number): boolean {
  if (!rrule) return true;
  const byday = /BYDAY=([A-Z,]+)/i.exec(rrule)?.[1];
  if (!byday) return true;
  const days = byday.split(',').map((d) => BYDAY[d.trim().toUpperCase()]);
  return days.includes(weekday);
}
