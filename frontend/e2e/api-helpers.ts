import type { APIRequestContext } from '@playwright/test';

const API_BASE = process.env.API_URL ?? 'http://localhost:3333/api/v1';
const DEV_PASSWORD = 'Devpass10!';

type Json = Record<string, unknown>;

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export function dataOf(body: Json): Json {
  return (body.data ?? body) as Json;
}

export function payloadOf<T>(body: Json): T {
  return (body.data ?? body) as T;
}

export function errorCode(body: Json): string | undefined {
  const error = body.error as Json | undefined;
  return error?.code as string | undefined;
}

export async function loginApi(
  request: APIRequestContext,
  email: string,
): Promise<{ accessToken: string }> {
  const res = await request.post(apiUrl('/auth/login'), {
    data: { email, password: DEV_PASSWORD },
  });
  if (!res.ok()) {
    throw new Error(`login falhou (${res.status()}): ${await res.text()}`);
  }
  const body = (await res.json()) as Json;
  const accessToken = dataOf(body).accessToken as string;
  if (!accessToken) throw new Error('accessToken ausente no login');
  return { accessToken };
}

export function authHeaders(token: string, locationId: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
    'x-location-id': locationId,
  };
}

export function randomPhone(): string {
  const suffix = crypto.randomUUID().replace(/\D/g, '').slice(0, 8);
  return `629${suffix}`;
}
