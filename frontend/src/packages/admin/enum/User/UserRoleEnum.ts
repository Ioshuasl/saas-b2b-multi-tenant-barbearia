export const USER_ROLES = ['OWNER', 'MANAGER', 'STAFF', 'RECEPTIONIST'] as const;

export const USER_ROLE_LABEL: Record<(typeof USER_ROLES)[number], string> = {
  OWNER: 'Dono',
  MANAGER: 'Gerente',
  STAFF: 'Profissional',
  RECEPTIONIST: 'Recepção',
};
