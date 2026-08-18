import { AuthResetData } from '@/packages/public/data/Auth/AuthResetData';
import type { AuthResetValues } from '@/packages/public/types/Auth/AuthTypes';

export async function AuthResetService(authReset: AuthResetValues) {
  return AuthResetData(authReset);
}
