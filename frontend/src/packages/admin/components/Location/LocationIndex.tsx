'use client';

import { useState } from 'react';
import { useLocationListHook } from '@/packages/admin/hooks/Location/useLocationListHook';
import { LocationTable } from '@/packages/admin/components/Location/LocationTable';
import { LocationFormDialog } from '@/packages/admin/components/Location/LocationFormDialog';
import { useSessionStore } from '@/shared/auth/session';
import { Button, PageHeader } from '@/shared/ui/Ui';
import type { LocationSummary } from '@/packages/admin/types/Location/LocationTypes';

export function LocationIndex() {
  const list = useLocationListHook();
  const role = useSessionStore((s) => s.me?.role);
  const canWrite = useSessionStore((s) => s.me?.permissions.includes('settings.write') ?? false);
  const canCreate = role === 'OWNER';
  const [editing, setEditing] = useState<LocationSummary | null | undefined>(undefined);

  return (
    <div>
      <PageHeader
        title="Unidades"
        description="Loja única não precisa de seletor. Só o dono cria unidade nova."
        action={
          canCreate ? (
            <Button type="button" onClick={() => setEditing(null)}>
              Nova unidade
            </Button>
          ) : null
        }
      />
      {list.isLoading ? <p className="text-sm opacity-70">Carregando…</p> : null}
      {list.isError ? <p className="text-sm text-red-300">Não foi possível listar as unidades.</p> : null}
      {list.data ? (
        <LocationTable locations={list.data} canWrite={canWrite} onEdit={setEditing} />
      ) : null}
      {editing !== undefined ? (
        <LocationFormDialog location={editing} onClose={() => setEditing(undefined)} />
      ) : null}
    </div>
  );
}
