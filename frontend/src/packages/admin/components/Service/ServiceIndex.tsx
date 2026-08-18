'use client';

import { useState } from 'react';
import { useServiceListHook } from '@/packages/admin/hooks/Service/useServiceListHook';
import { ServiceTable } from '@/packages/admin/components/Service/ServiceTable';
import { ServiceFormDialog } from '@/packages/admin/components/Service/ServiceFormDialog';
import { useSessionStore } from '@/shared/auth/session';
import { Button, PageHeader } from '@/shared/ui/Ui';
import type { ServiceSummary } from '@/packages/admin/types/Service/ServiceTypes';

export function ServiceIndex() {
  const list = useServiceListHook();
  const canWrite = useSessionStore((s) => s.me?.permissions.includes('settings.write') ?? false);
  const [editing, setEditing] = useState<ServiceSummary | null | undefined>(undefined);

  return (
    <div>
      <PageHeader
        title="Serviços"
        description="Catálogo da rede. Preço zero no início; ajuste quando quiser."
        action={
          canWrite ? (
            <Button type="button" onClick={() => setEditing(null)}>
              Novo serviço
            </Button>
          ) : null
        }
      />
      {list.isLoading ? <p className="text-sm opacity-70">Carregando…</p> : null}
      {list.data ? (
        <ServiceTable services={list.data} canWrite={canWrite} onEdit={setEditing} />
      ) : null}
      {editing !== undefined ? (
        <ServiceFormDialog service={editing} onClose={() => setEditing(undefined)} />
      ) : null}
    </div>
  );
}
