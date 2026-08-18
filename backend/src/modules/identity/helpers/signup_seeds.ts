export const SIGNUP_SERVICES = [
  { name: 'Corte', durationMinutes: 40, sortOrder: 1 },
  { name: 'Barba', durationMinutes: 20, sortOrder: 2 },
  { name: 'Corte + barba', durationMinutes: 50, sortOrder: 3 },
] as const;

export const SIGNUP_HOURS_WEEKDAYS = [1, 2, 3, 4, 5, 6] as const;

export function signupHourRange(): { startsAt: Date; endsAt: Date } {
  return {
    startsAt: new Date(Date.UTC(1970, 0, 1, 9, 0, 0)),
    endsAt: new Date(Date.UTC(1970, 0, 1, 19, 0, 0)),
  };
}
