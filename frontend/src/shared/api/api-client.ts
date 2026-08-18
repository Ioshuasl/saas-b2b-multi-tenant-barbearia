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

class ApiClient {
  async request<T>(path: string, init: RequestInit & { skipAuth?: boolean } = {}): Promise<T> {
    const { skipAuth: _skipAuth, headers, ...rest } = init;
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/v1${path}`, {
        ...rest,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
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
