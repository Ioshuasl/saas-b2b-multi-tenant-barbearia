'use client';

import type { ReactNode } from 'react';
import { QueryProvider } from '@/shared/providers/QueryProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
