/** Envelope de sucesso da API (`docs/08`). */
export type ApiSuccess<T> = {
  data: T;
  meta?: ApiListMeta;
};

export type ApiListMeta = {
  nextCursor?: string | null;
  total?: number;
};

/** Envelope de erro da API (`docs/08`). */
export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

export * from './customer.js';
export * from './appointment.js';
export * from './availability.js';
export * from './public_booking.js';
export * from './messaging.js';

export function isApiError(body: unknown): body is ApiErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as ApiErrorBody).error === 'object'
  );
}

export type LocationAddress = {
  zip?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
};

export type LocationSummary = {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  timezone: string;
  phone: string | null;
  email: string | null;
  address: LocationAddress | null;
  coverUrl: string | null;
  bookingLeadTimeMinutes: number;
  bookingHorizonDays: number;
  cancelDeadlineHours: number;
  acceptsOnlineBooking: boolean;
  isDefault: boolean;
  active: boolean;
};
