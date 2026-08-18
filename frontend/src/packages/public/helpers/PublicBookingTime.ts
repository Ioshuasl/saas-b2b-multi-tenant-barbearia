import { addDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { AvailabilitySlot } from '@repo/contracts';

export function todayKey(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
}

export function addDaysKey(dayKey: string, days: number, timezone: string): string {
  const date = fromZonedTime(`${dayKey}T12:00:00`, timezone);
  return formatInTimeZone(addDays(date, days), timezone, 'yyyy-MM-dd');
}

export function upcomingDayKeys(timezone: string, count: number, startKey?: string): string[] {
  const start = startKey ?? todayKey(timezone);
  return Array.from({ length: count }, (_, index) => addDaysKey(start, index, timezone));
}

export function formatTimeInTimezone(iso: string, timezone: string): string {
  return formatInTimeZone(iso, timezone, 'HH:mm');
}

export function formatDayChip(dayKey: string, timezone: string): string {
  const date = fromZonedTime(`${dayKey}T12:00:00`, timezone);
  return formatInTimeZone(date, timezone, 'EEE dd/MM');
}

export function slotDayKey(iso: string, timezone: string): string {
  return formatInTimeZone(iso, timezone, 'yyyy-MM-dd');
}

export function formatDateTimeInTimezone(iso: string, timezone: string): string {
  return formatInTimeZone(iso, timezone, "dd/MM/yyyy 'às' HH:mm");
}

export function uniqueSlotsByStart(slots: AvailabilitySlot[]): AvailabilitySlot[] {
  const seen = new Set<string>();
  return slots.filter((slot) => {
    if (seen.has(slot.startsAt)) return false;
    seen.add(slot.startsAt);
    return true;
  });
}
