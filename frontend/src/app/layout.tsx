import type { ReactNode } from 'react';
import { AppProviders } from '@/shared/providers/AppProviders';
import './globals.css';

export const metadata = {
  title: 'Agenda da barbearia',
  description: 'Agendamento para barbearias',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
