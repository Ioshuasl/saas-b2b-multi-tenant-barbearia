'use client';

import { useState } from 'react';
import { BusinessHoursEditor } from '@/packages/admin/components/BusinessHours/BusinessHoursEditor';
import { TimeBlockTable } from '@/packages/admin/components/TimeBlock/TimeBlockTable';
import { TimeBlockFormDialog } from '@/packages/admin/components/TimeBlock/TimeBlockFormDialog';
import { useTimeBlockListHook } from '@/packages/admin/hooks/TimeBlock/useTimeBlockListHook';
import { useTimeBlockDeleteHook } from '@/packages/admin/hooks/TimeBlock/useTimeBlockDeleteHook';
import { useSessionStore } from '@/shared/auth/session';
import { Button, PageHeader } from '@/shared/ui/Ui';

export function BusinessHoursForm() {
  const locationId = useSessionStore((s) => s.locationId);
  const canWrite = useSessionStore((s) => s.me?.permissions.includes('settings.write') ?? false);
  const blocks = useTimeBlockListHook(locationId);
  const remove = useTimeBlockDeleteHook();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Horários"
        description="Semana da unidade ativa (ISO 1–7). Bloqueios pontuais ou RRULE ficam abaixo."
        action={
          canWrite && locationId ? (
            <Button type="button" onClick={() => setOpen(true)}>
              Novo bloqueio
            </Button>
          ) : null
        }
      />
      {!locationId ? (
        <p className="text-sm opacity-70">Nenhuma unidade no escopo.</p>
      ) : (
        <BusinessHoursEditor locationId={locationId} />
      )}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Bloqueios</h2>
        {blocks.data ? (
          <TimeBlockTable
            blocks={blocks.data}
            canWrite={canWrite}
            onDelete={(id) => remove.mutate(id)}
          />
        ) : null}
      </section>
      {open && locationId ? (
        <TimeBlockFormDialog locationId={locationId} onClose={() => setOpen(false)} />
      ) : null}
    </div>
  );
}
