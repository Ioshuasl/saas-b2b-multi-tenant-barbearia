import { AuthSignupData } from '@/packages/public/data/Auth/AuthSignupData';
import type { AuthSignupValues } from '@/packages/public/types/Auth/AuthTypes';

export async function AuthSignupService(authSignup: AuthSignupValues) {
  return AuthSignupData(authSignup);
}
