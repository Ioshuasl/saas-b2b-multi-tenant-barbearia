export type { AuthSessionPayload, MeResponse, MeUser } from '@/shared/auth/MeTypes';

export type AuthLoginValues = {
  email: string;
  password: string;
};

export type AuthSignupValues = {
  email: string;
  password: string;
  tenantName: string;
  phone: string;
};

export type AuthForgotValues = {
  email: string;
};

export type AuthResetValues = {
  token: string;
  password: string;
};

export type AuthAcceptInviteValues = {
  token: string;
  password: string;
  name: string;
};
