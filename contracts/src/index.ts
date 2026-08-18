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

export function isApiError(body: unknown): body is ApiErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as ApiErrorBody).error === 'object'
  );
}

export type LocationSummary = {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  timezone: string;
  isDefault: boolean;
  active: boolean;
};
