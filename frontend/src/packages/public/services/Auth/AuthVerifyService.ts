import { AuthVerifyData } from '@/packages/public/data/Auth/AuthVerifyData';

export async function AuthVerifyService(token: string) {
  return AuthVerifyData(token);
}
