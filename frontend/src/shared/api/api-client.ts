import type { ApiResponse } from '@repo/contracts';
import { isApiError } from '@repo/contracts';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type RequestOptions = RequestInit & {
  query?: Record<string, string | undefined>;
  skipRefresh?: boolean;
};

class ApiClient {
  private accessToken: string | null = null;
  private locationId: string | null = null;
  private refreshing: Promise<void> | null = null;

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  setLocationId(locationId: string | null): void {
    this.locationId = locationId;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async request<T>(path: string, init: RequestOptions = {}): Promise<T> {
    const { query, skipRefresh, headers, ...rest } = init;
    const url = this.buildUrl(path, query);
    const res = await this.fetchRaw(url, rest, headers);

    if (res.status === 401 && !skipRefresh && !path.startsWith('/auth/refresh')) {
      await (this.refreshing ??= this.refresh().finally(() => {
        this.refreshing = null;
      }));
      const retry = await this.fetchRaw(url, rest, headers);
      return this.parse<T>(retry);
    }

    return this.parse<T>(res);
  }

  async refresh(): Promise<void> {
    const session = await this.request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      skipRefresh: true,
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    this.setAccessToken(session.accessToken);
  }

  private buildUrl(path: string, query?: Record<string, string | undefined>): string {
    const base = `${API_URL}/api/v1${path}`;
    if (!query) return base;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  private async fetchRaw(
    url: string,
    init: RequestInit,
    headers?: HeadersInit,
  ): Promise<Response> {
    try {
      return await fetch(url, {
        ...init,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
          ...(this.locationId ? { 'X-Location-Id': this.locationId } : {}),
          ...(headers ?? {}),
        },
      });
    } catch {
      throw new ApiClientError(
        'NETWORK_ERROR',
        `Não foi possível conectar à API (${API_URL}).`,
        0,
      );
    }
  }

  private async parse<T>(res: Response): Promise<T> {
    const body = (await res.json()) as ApiResponse<T>;
    if (!res.ok || isApiError(body)) {
      if (isApiError(body)) {
        throw new ApiClientError(body.error.code, body.error.message, res.status, body.error.details);
      }
      throw new ApiClientError('INTERNAL_ERROR', 'Resposta inválida da API.', res.status);
    }
    return body.data;
  }
}

export const apiClient = new ApiClient();
