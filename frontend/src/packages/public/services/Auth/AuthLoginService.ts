import { AuthLoginData } from '@/packages/public/data/Auth/AuthLoginData';
import type { AuthLoginValues } from '@/packages/public/types/Auth/AuthTypes';

export async function AuthLoginService(authLogin: AuthLoginValues) {
  return AuthLoginData(authLogin);
}
