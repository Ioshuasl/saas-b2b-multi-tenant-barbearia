'use client';

import type { ReactNode } from 'react';
import { useSessionStore } from '@/shared/auth/session';

export function Can({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const allowed = useSessionStore((s) => s.me?.permissions.includes(permission) ?? false);
  if (!allowed) return null;
  return children;
}
