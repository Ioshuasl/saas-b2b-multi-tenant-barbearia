'use client';

import Link from 'next/link';
import { useOnboardingGetHook } from '@/packages/admin/hooks/Onboarding/useOnboardingGetHook';
import { useSessionStore } from '@/shared/auth/session';
import { Card } from '@/shared/ui/Ui';

export function HomeIndex() {
  const me = useSessionStore((s) => s.me);
  const onboarding = useOnboardingGetHook(me?.role === 'OWNER');

  if (me?.role !== 'OWNER' || onboarding.data?.publishedAt) return null;

  return (
    <Card className="mb-4">
      <h2 className="font-medium">Configurar loja</h2>
      <p className="mt-1 text-sm opacity-80">Quatro passos até o link e o QR.</p>
      <Link className="mt-3 inline-block text-sm underline" href="/inicio">
        Continuar
      </Link>
    </Card>
  );
}
