'use client';

import { useMemo, useState } from 'react';
import { useStaffListHook } from '@/packages/admin/hooks/Staff/useStaffListHook';
import { useLocationListHook } from '@/packages/admin/hooks/Location/useLocationListHook';
import { StaffTable } from '@/packages/admin/components/Staff/StaffTable';
import { StaffFormDialog } from '@/packages/admin/components/Staff/StaffFormDialog';
import { StaffInviteFormDialog } from '@/packages/admin/components/Staff/StaffInviteFormDialog';
import { useSessionStore } from '@/shared/auth/session';
import { Button, PageHeader } from '@/shared/ui/Ui';
import type { StaffSummary } from '@/packages/admin/types/Staff/StaffTypes';

export function StaffIndex() {
  const list = useStaffListHook();
  const locations = useLocationListHook();
  const canWrite = useSessionStore((s) => s.me?.permissions.includes('settings.write') ?? false);
  const [editing, setEditing] = useState<StaffSummary | null | undefined>(undefined);
  const [inviteId, setInviteId] = useState<string | null>(null);
  const locationNames = useMemo(
    () => Object.fromEntries((locations.data ?? []).map((location) => [location.id, location.name])),
    [locations.data],
  );

  return (
    <div>
      <PageHeader
        title="Profissionais"
        description="Cadastre a equipe da unidade e envie o convite de acesso."
        action={
          canWrite ? (
            <Button type="button" onClick={() => setEditing(null)}>
              Novo profissional
            </Button>
          ) : null
        }
      />
      {list.isLoading ? <p className="text-sm opacity-70">Carregando…</p> : null}
      {list.data ? (
        <StaffTable
          staff={list.data}
          locationNames={locationNames}
          canWrite={canWrite}
          onEdit={setEditing}
          onInvite={setInviteId}
        />
      ) : null}
      {editing !== undefined ? (
        <StaffFormDialog staff={editing} onClose={() => setEditing(undefined)} />
      ) : null}
      {inviteId ? <StaffInviteFormDialog staffId={inviteId} onClose={() => setInviteId(null)} /> : null}
    </div>
  );
}
