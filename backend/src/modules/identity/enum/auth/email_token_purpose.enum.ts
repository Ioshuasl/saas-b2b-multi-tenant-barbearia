export const EmailTokenPurpose = {
  PASSWORD_RESET: 'PASSWORD_RESET',
  EMAIL_VERIFY: 'EMAIL_VERIFY',
} as const;

export type EmailTokenPurposeName =
  (typeof EmailTokenPurpose)[keyof typeof EmailTokenPurpose];
