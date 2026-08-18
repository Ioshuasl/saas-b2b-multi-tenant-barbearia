const SILENCE_START_HOUR = 21;
const SILENCE_END_HOUR = 8;

function localParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    hour: pick('hour'),
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
  };
}

function isInSilenceWindow(date: Date, timezone: string): boolean {
  const { hour } = localParts(date, timezone);
  return hour >= SILENCE_START_HOUR || hour < SILENCE_END_HOUR;
}

/** Adia envio para 08:00 local se cair na janela 21h–8h. */
export function applySilenceWindow(sendAt: Date, timezone: string): Date {
  if (!isInSilenceWindow(sendAt, timezone)) return sendAt;

  const { year, month, day, hour } = localParts(sendAt, timezone);
  let targetDay = day;
  let targetMonth = month;
  let targetYear = year;

  if (hour >= SILENCE_START_HOUR) {
    const next = new Date(Date.UTC(targetYear, targetMonth - 1, targetDay + 1, SILENCE_END_HOUR, 0, 0));
    return shiftToTimezone(next, timezone, SILENCE_END_HOUR);
  }

  return shiftToTimezone(new Date(Date.UTC(targetYear, targetMonth - 1, targetDay, SILENCE_END_HOUR, 0, 0)), timezone, SILENCE_END_HOUR);
}

function shiftToTimezone(baseUtc: Date, timezone: string, hour: number): Date {
  const probe = new Date(baseUtc);
  for (let i = 0; i < 48; i++) {
    const parts = localParts(probe, timezone);
    if (parts.hour === hour) return probe;
    probe.setUTCMinutes(probe.getUTCMinutes() + 30);
  }
  return baseUtc;
}

export function reminderSendAt(startsAt: Date, offsetMs: number, timezone: string): Date {
  const raw = new Date(startsAt.getTime() - offsetMs);
  if (raw.getTime() <= Date.now()) return new Date(Date.now() + 1000);
  return applySilenceWindow(raw, timezone);
}

export const REMINDER_24H_MS = 24 * 60 * 60 * 1000;
export const REMINDER_2H_MS = 2 * 60 * 60 * 1000;
