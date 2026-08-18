import type { UserRoleName } from '../user/user_role.enum.js';

export const PERMISSIONS = [
  'agenda.read',
  'agenda.write',
  'customers.read',
  'customers.write',
  'finance.read',
  'finance.write',
  'messaging.read',
  'messaging.configure',
  'reports.read',
  'reports.financial',
  'reports.network',
  'settings.read',
  'settings.write',
  'users.manage',
  'subscription.manage',
  'data.export',
  'audit.read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<UserRoleName, readonly Permission[]> = {
  OWNER: PERMISSIONS,
  MANAGER: [
    'agenda.read',
    'agenda.write',
    'customers.read',
    'customers.write',
    'finance.read',
    'finance.write',
    'messaging.read',
    'reports.read',
    'reports.financial',
    'settings.read',
    'settings.write',
    'users.manage',
  ],
  STAFF: ['agenda.read', 'agenda.write', 'customers.read', 'reports.read'],
  RECEPTIONIST: [
    'agenda.read',
    'agenda.write',
    'customers.read',
    'customers.write',
    'finance.read',
    'finance.write',
    'reports.read',
    'settings.read',
  ],
};
