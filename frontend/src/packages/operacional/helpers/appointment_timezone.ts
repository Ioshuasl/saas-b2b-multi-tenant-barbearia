import { addDays, startOfWeek } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export function formatDayKey(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
}

export function dayRangeIso(
  dayKey: string,
  timezone: string,
): { from: string; to: string } {
  return {
    from: fromZonedTime(`${dayKey}T00:00:00`, timezone).toISOString(),
    to: fromZonedTime(`${dayKey}T23:59:59.999`, timezone).toISOString(),
  };
}

export function weekDayKeys(anchor: Date, timezone: string): string[] {
  const zonedAnchor = fromZonedTime(formatInTimeZone(anchor, timezone, 'yyyy-MM-dd'), timezone);
  const monday = startOfWeek(zonedAnchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) =>
    formatInTimeZone(addDays(monday, index), timezone, 'yyyy-MM-dd'),
  );
}

export function weekRangeIso(
  anchor: Date,
  timezone: string,
): { from: string; to: string; dayKeys: string[] } {
  const dayKeys = weekDayKeys(anchor, timezone);
  const first = dayKeys[0];
  const last = dayKeys[6];
  if (!first || !last) {
    throw new Error('weekRangeIso: invalid week');
  }
  return {
    dayKeys,
    from: dayRangeIso(first, timezone).from,
    to: dayRangeIso(last, timezone).to,
  };
}

export function slotIsoFromDay(
  dayKey: string,
  minutesFromMidnight: number,
  timezone: string,
): string {
  const hours = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  const local = `${dayKey}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  return fromZonedTime(local, timezone).toISOString();
}

export function minutesInTimezone(iso: string, timezone: string, dayKey: string): number {
  const time = formatInTimeZone(iso, timezone, 'HH:mm');
  const [hours, minutes] = time.split(':').map(Number);
  const day = formatInTimeZone(iso, timezone, 'yyyy-MM-dd');
  if (day !== dayKey) return day < dayKey ? 0 : 24 * 60;
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function formatTimeInTimezone(iso: string, timezone: string): string {
  return formatInTimeZone(iso, timezone, 'HH:mm');
}

export function formatDayLabel(dayKey: string, timezone: string): string {
  const date = fromZonedTime(`${dayKey}T12:00:00`, timezone);
  return formatInTimeZone(date, timezone, "EEE, dd/MM");
}

export function todayKey(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
}
