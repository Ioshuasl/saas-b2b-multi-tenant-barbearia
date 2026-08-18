import type { ReactNode } from 'react';
import { AppShell } from '@/packages/admin/components/Shell/AppShell';
import { MessagingSessionBanner } from '@/packages/messaging/components/Account/MessagingSessionBanner';

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell banner={<MessagingSessionBanner />}>{children}</AppShell>;
}
