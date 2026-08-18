const PREFIX = 'public-booking:';

export type PublicBookingSession = {
  token: string;
  serviceIds: string[];
};

export function savePublicBookingSession(appointmentId: string, payload: PublicBookingSession): void {
  sessionStorage.setItem(`${PREFIX}${appointmentId}`, JSON.stringify(payload));
}

export function loadPublicBookingSession(appointmentId: string): PublicBookingSession | null {
  const raw = sessionStorage.getItem(`${PREFIX}${appointmentId}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PublicBookingSession;
    if (typeof parsed.token !== 'string' || !Array.isArray(parsed.serviceIds)) return null;
    return parsed;
  } catch {
    return null;
  }
}
