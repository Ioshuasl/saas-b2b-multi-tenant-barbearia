'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionMeHook } from '@/packages/admin/hooks/Session/useSessionMeHook';
import { useSessionLogoutHook } from '@/packages/admin/hooks/Session/useSessionLogoutHook';
import { useLocationListHook } from '@/packages/admin/hooks/Location/useLocationListHook';
import { useOnboardingGetHook } from '@/packages/admin/hooks/Onboarding/useOnboardingGetHook';
import { useSessionStore } from '@/shared/auth/session';
import { AppNav } from '@/packages/admin/components/Shell/AppNav';
import { LocationSwitcher } from '@/packages/admin/components/Shell/LocationSwitcher';
import { GhostButton } from '@/shared/ui/Ui';

export function AppShell({ children, banner }: { children: ReactNode; banner?: ReactNode }) {
  const meQuery = useSessionMeHook();
  const locationsQuery = useLocationListHook(meQuery.isSuccess);
  const onboardingQuery = useOnboardingGetHook(meQuery.isSuccess);
  const logout = useSessionLogoutHook();
  const router = useRouter();
  const me = useSessionStore((s) => s.me);
  const locationId = useSessionStore((s) => s.locationId);
  const setLocationId = useSessionStore((s) => s.setLocationId);

  const scoped = useMemo(() => {
    const all = (locationsQuery.data ?? []).filter((location) => location.active);
    if (me?.locationIds === 'ALL') return all;
    const ids = new Set(me?.locationIds ?? []);
    return all.filter((location) => ids.has(location.id));
  }, [locationsQuery.data, me]);

  useEffect(() => {
    if (meQuery.isError) router.replace('/login');
  }, [meQuery.isError, router]);

  useEffect(() => {
    const first = scoped[0];
    if (!first) return;
    if (scoped.length === 1) {
      if (locationId !== first.id) setLocationId(first.id);
      return;
    }
    if (!locationId || !scoped.some((location) => location.id === locationId)) {
      setLocationId(first.id);
    }
  }, [scoped, locationId, setLocationId]);

  if (meQuery.isLoading || meQuery.isError || !me) {
    return <p className="p-6 text-sm opacity-70">Carregando sessão…</p>;
  }

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-white/10 md:border-b-0 md:border-r">
        <p className="px-6 py-4 text-sm font-medium text-[var(--accent)]">
          {me.user.tenantSlug}
        </p>
        <AppNav showWizard={!onboardingQuery.data?.publishedAt} />
      </aside>
      <div>
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-3">
          <LocationSwitcher locations={scoped} />
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="opacity-70">{me.user.name}</span>
            <GhostButton type="button" onClick={() => logout.mutate()} disabled={logout.isPending}>
              Sair
            </GhostButton>
          </div>
        </header>
        {banner}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
