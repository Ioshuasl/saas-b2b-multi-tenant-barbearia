import type { ReactNode } from 'react';
import { AppShell } from '@/packages/admin/components/Shell/AppShell';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
