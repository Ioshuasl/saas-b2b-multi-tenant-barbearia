import { timeFromHhmm } from './working_windows.js';

export const DEFAULT_HOUR_WEEKDAYS = [1, 2, 3, 4, 5, 6] as const;

export function defaultHourRange(): { startsAt: Date; endsAt: Date } {
  return {
    startsAt: timeFromHhmm('09:00'),
    endsAt: timeFromHhmm('19:00'),
  };
}
