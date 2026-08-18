import { minutesInTimezone } from '@/packages/operacional/helpers/appointment_timezone';

export const SLOT_MINUTES = 15;
export const ROW_HEIGHT_PX = 20;
export const GRID_START_HOUR = 7;
export const GRID_END_HOUR = 21;

export function gridStartMinutes(): number {
  return GRID_START_HOUR * 60;
}

export function gridEndMinutes(): number {
  return GRID_END_HOUR * 60;
}

export function gridTotalMinutes(): number {
  return gridEndMinutes() - gridStartMinutes();
}

export function gridHeightPx(): number {
  return (gridTotalMinutes() / SLOT_MINUTES) * ROW_HEIGHT_PX;
}

export function slotCount(): number {
  return gridTotalMinutes() / SLOT_MINUTES;
}

export function timeLabels(): string[] {
  const labels: string[] = [];
  for (let hour = GRID_START_HOUR; hour < GRID_END_HOUR; hour++) {
    labels.push(`${String(hour).padStart(2, '0')}:00`);
  }
  return labels;
}

export function minutesToTop(minutes: number): number {
  return ((minutes - gridStartMinutes()) / SLOT_MINUTES) * ROW_HEIGHT_PX;
}

export function durationToHeight(durationMinutes: number): number {
  return (durationMinutes / SLOT_MINUTES) * ROW_HEIGHT_PX;
}

export function snapMinutes(minutes: number): number {
  return Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;
}

export function yToMinutes(y: number): number {
  const raw = gridStartMinutes() + (y / ROW_HEIGHT_PX) * SLOT_MINUTES;
  return snapMinutes(Math.max(gridStartMinutes(), Math.min(gridEndMinutes() - SLOT_MINUTES, raw)));
}

export function appointmentLayout(
  startsAt: string,
  endsAt: string,
  dayKey: string,
  timezone: string,
): { top: number; height: number } {
  const startMin = minutesInTimezone(startsAt, timezone, dayKey);
  const endMin = minutesInTimezone(endsAt, timezone, dayKey);
  const top = minutesToTop(Math.max(startMin, gridStartMinutes()));
  const height = durationToHeight(Math.max(SLOT_MINUTES, endMin - startMin));
  return { top, height };
}
