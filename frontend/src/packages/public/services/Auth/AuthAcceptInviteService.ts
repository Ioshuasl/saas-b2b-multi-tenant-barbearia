import { AuthAcceptInviteData } from '@/packages/public/data/Auth/AuthAcceptInviteData';
import type { AuthAcceptInviteValues } from '@/packages/public/types/Auth/AuthTypes';

export async function AuthAcceptInviteService(authAccept: AuthAcceptInviteValues) {
  return AuthAcceptInviteData(authAccept);
}
