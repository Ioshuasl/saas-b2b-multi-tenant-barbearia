'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  customerFormValues,
  useCustomerFormHook,
} from '@/packages/operacional/hooks/Customer/useCustomerFormHook';
import { useCustomerCreateHook } from '@/packages/operacional/hooks/Customer/useCustomerCreateHook';
import { useCustomerUpdateHook } from '@/packages/operacional/hooks/Customer/useCustomerUpdateHook';
import { useCustomerGetHook } from '@/packages/operacional/hooks/Customer/useCustomerGetHook';
import { useCustomerCheckDuplicateHook } from '@/packages/operacional/hooks/Customer/useCustomerCheckDuplicateHook';
import { CustomerOrigin } from '@/packages/operacional/enum/Customer/CustomerOriginEnum';
import { tryNormalizePhoneE164 } from '@/packages/operacional/schemas/Customer/CustomerSchema';
import type { CustomerFormDialogProps } from '@/packages/operacional/types/Customer/CustomerFormDialogTypes';
import type { CustomerFormValues } from '@/packages/operacional/types/Customer/CustomerTypes';
import { Dialog } from '@/shared/ui/Dialog';
import { Button, Field, Input, Textarea } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';
import { useSessionStore } from '@/shared/auth/session';

export function CustomerFormDialog({ customer, onClose }: CustomerFormDialogProps) {
  const canWriteNotes = useSessionStore((s) => s.me?.permissions.includes('customers.write') ?? false);
  const detail = useCustomerGetHook(customer?.id ?? null);
  const form = useCustomerFormHook(detail.data ?? customer);
  const create = useCustomerCreateHook();
  const update = useCustomerUpdateHook();
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;
  const isCreate = !customer;

  const phoneRaw = form.watch('phone');
  const [debouncedPhone, setDebouncedPhone] = useState(phoneRaw);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPhone(phoneRaw), 400);
    return () => clearTimeout(timer);
  }, [phoneRaw]);

  const phoneE164 = tryNormalizePhoneE164(debouncedPhone ?? '');
  const duplicate = useCustomerCheckDuplicateHook(phoneE164 ?? '', isCreate && Boolean(phoneE164));
  const duplicateId = duplicate.data?.exists ? duplicate.data.customerId : undefined;

  function handleForm() {
    form.reset(customerFormValues(detail.data ?? customer));
  }

  useEffect(() => {
    handleForm();
  }, [customer, detail.data]);

  async function onSave(values: CustomerFormValues) {
    if (duplicateId) return;
    if (customer) {
      await update.mutateAsync({
        id: customer.id,
        customerSchema: {
          name: values.name,
          email: values.email ? values.email : null,
          notes: canWriteNotes ? (values.notes || null) : undefined,
          marketingOptIn: values.marketingOptIn,
        },
      });
    } else {
      await create.mutateAsync({
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        notes: canWriteNotes ? values.notes || undefined : undefined,
        marketingOptIn: values.marketingOptIn,
        origin: CustomerOrigin.PANEL,
      });
    }
    onClose();
  }

  return (
    <Dialog title={customer ? 'Editar cliente' : 'Novo cliente'} onClose={onClose}>
      {customer && detail.isLoading ? (
        <p className="text-sm opacity-70">Carregando ficha…</p>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSave)}>
          <Field label="Nome" error={form.formState.errors.name?.message}>
            <Input {...form.register('name')} autoComplete="name" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Telefone" error={form.formState.errors.phone?.message}>
              <Input
                {...form.register('phone')}
                inputMode="tel"
                autoComplete="tel"
                placeholder="DDD + número"
                disabled={!isCreate}
              />
            </Field>
            <Field label="E-mail" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register('email')} autoComplete="email" />
            </Field>
          </div>
          {isCreate && duplicateId ? (
            <p className="text-sm text-amber-200">
              Já existe um cliente com este telefone.{' '}
              <Link href={`/clientes/${duplicateId}`} className="underline">
                Abrir ficha
              </Link>
            </p>
          ) : null}
          {canWriteNotes ? (
            <Field label="Observações" error={form.formState.errors.notes?.message}>
              <Textarea {...form.register('notes')} maxLength={2000} />
            </Field>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('marketingOptIn')} />
            Aceita mensagens de marketing
          </label>
          {error ? <p className="text-sm text-red-300">{apiErrorMessage(error)}</p> : null}
          <Button type="submit" disabled={pending || Boolean(duplicateId)}>
            {pending ? 'Salvando…' : 'Salvar'}
          </Button>
        </form>
      )}
    </Dialog>
  );
}
