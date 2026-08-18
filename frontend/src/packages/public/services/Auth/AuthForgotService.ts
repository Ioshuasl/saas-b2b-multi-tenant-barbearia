import { AuthForgotData } from '@/packages/public/data/Auth/AuthForgotData';
import type { AuthForgotValues } from '@/packages/public/types/Auth/AuthTypes';

export async function AuthForgotService(authForgot: AuthForgotValues) {
  return AuthForgotData(authForgot);
}
