'use client';

import Link from 'next/link';
import { useOnboardingGetHook } from '@/packages/admin/hooks/Onboarding/useOnboardingGetHook';
import { useSessionStore } from '@/shared/auth/session';
import { Card, PageHeader } from '@/shared/ui/Ui';

export function HomeIndex() {
  const me = useSessionStore((s) => s.me);
  const onboarding = useOnboardingGetHook();
  const canSettings = me?.permissions.includes('settings.read') ?? false;

  return (
    <div>
      <PageHeader
        title={`Olá, ${me?.user.name ?? ''}`}
        description="Painel da barbearia. A agenda do dia entra na Sprint 3."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {canSettings ? (
          <Card>
            <h2 className="font-medium">Cadastros</h2>
            <p className="mt-1 text-sm opacity-80">Unidades, horários, serviços e profissionais.</p>
            <Link className="mt-3 inline-block text-sm underline" href="/configuracoes/unidades">
              Abrir cadastros
            </Link>
          </Card>
        ) : null}
        {me?.permissions.includes('users.manage') ? (
          <Card>
            <h2 className="font-medium">Equipe</h2>
            <p className="mt-1 text-sm opacity-80">Convide gerentes, recepção e profissionais.</p>
            <Link className="mt-3 inline-block text-sm underline" href="/configuracoes/equipe">
              Abrir equipe
            </Link>
          </Card>
        ) : null}
        {me?.role === 'OWNER' && !onboarding.data?.publishedAt ? (
          <Card>
            <h2 className="font-medium">Configurar loja</h2>
            <p className="mt-1 text-sm opacity-80">Quatro passos até o link e o QR.</p>
            <Link className="mt-3 inline-block text-sm underline" href="/inicio">
              Continuar
            </Link>
          </Card>
        ) : null}
        {!canSettings ? (
          <Card>
            <h2 className="font-medium">Agenda</h2>
            <p className="mt-1 text-sm opacity-80">Sua grade do dia chega na Sprint 3.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
