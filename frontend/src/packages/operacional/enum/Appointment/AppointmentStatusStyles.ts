import type { AppointmentStatusName } from '@repo/contracts';

export const APPOINTMENT_STATUS_ICONS: Record<AppointmentStatusName, string> = {
  SCHEDULED: '○',
  CONFIRMED: '◐',
  IN_SERVICE: '●',
  COMPLETED: '✓',
  CANCELLED: '✕',
  NO_SHOW: '!',
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatusName, string> = {
  SCHEDULED: 'border-sky-500/60 bg-sky-500/15',
  CONFIRMED: 'border-emerald-500/60 bg-emerald-500/15',
  IN_SERVICE: 'border-amber-500/60 bg-amber-500/15',
  COMPLETED: 'border-zinc-400/40 bg-zinc-500/15',
  CANCELLED: 'border-red-500/40 bg-red-500/10 opacity-60',
  NO_SHOW: 'border-orange-500/50 bg-orange-500/10',
};
