'use client';

import { useEffect } from 'react';
import { tenantFormValues, useTenantFormHook } from '@/packages/admin/hooks/Tenant/useTenantFormHook';
import { useTenantGetHook } from '@/packages/admin/hooks/Tenant/useTenantGetHook';
import { useTenantUpdateHook } from '@/packages/admin/hooks/Tenant/useTenantUpdateHook';
import { useTenantSlugAvailableHook } from '@/packages/admin/hooks/Tenant/useTenantSlugAvailableHook';
import { useSessionStore } from '@/shared/auth/session';
import { Button, Field, Input, PageHeader } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';
import type { TenantFormValues } from '@/packages/admin/types/Tenant/TenantTypes';

export function TenantForm() {
  const tenantQuery = useTenantGetHook();
  const form = useTenantFormHook(tenantQuery.data);
  const update = useTenantUpdateHook();
  const slug = form.watch('slug');
  const slugCheck = useTenantSlugAvailableHook(slug);
  const isOwner = useSessionStore((s) => s.me?.role === 'OWNER');

  useEffect(() => {
    if (tenantQuery.data) form.reset(tenantFormValues(tenantQuery.data));
    // reset quando o tenant chega
  }, [tenantQuery.data]);

  async function onSave(values: TenantFormValues) {
    await update.mutateAsync(values);
  }

  return (
    <div>
      <PageHeader
        title="Rede"
        description="Nome, slug e aparência da barbearia. Só o dono altera."
      />
      {tenantQuery.isLoading ? <p className="text-sm opacity-70">Carregando…</p> : null}
      {tenantQuery.data ? (
        <form className="flex max-w-md flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
          <Field label="Nome" error={form.formState.errors.name?.message}>
            <Input {...form.register('name')} disabled={!isOwner} />
          </Field>
          <Field label="Slug" error={form.formState.errors.slug?.message}>
            <Input {...form.register('slug')} disabled={!isOwner} />
          </Field>
          {slugCheck.data && !slugCheck.data.available ? (
            <p className="text-xs text-red-300">
              Slug indisponível
              {slugCheck.data.suggestion ? ` — sugestão: ${slugCheck.data.suggestion}` : '.'}
            </p>
          ) : null}
          <Field label="Logo (URL)" error={form.formState.errors.logoUrl?.message}>
            <Input {...form.register('logoUrl')} disabled={!isOwner} />
          </Field>
          <Field label="Cor da marca (#RRGGBB)" error={form.formState.errors.brandColor?.message}>
            <Input {...form.register('brandColor')} disabled={!isOwner} />
          </Field>
          <p className="text-xs opacity-60">
            Status: {tenantQuery.data.status}
            {tenantQuery.data.trialEndsAt
              ? ` · trial até ${new Date(tenantQuery.data.trialEndsAt).toLocaleDateString('pt-BR')}`
              : ''}
          </p>
          {update.isError ? (
            <p className="text-sm text-red-300">{apiErrorMessage(update.error)}</p>
          ) : null}
          {update.isSuccess ? <p className="text-sm text-[var(--accent)]">Salvo.</p> : null}
          {isOwner ? (
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          ) : (
            <p className="text-sm opacity-70">Somente o dono altera o perfil da rede.</p>
          )}
        </form>
      ) : null}
    </div>
  );
}
