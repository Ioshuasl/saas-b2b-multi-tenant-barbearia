'use client';

import { usePublicAppointmentFormHook } from '@/packages/public/hooks/PublicAppointment/usePublicAppointmentFormHook';
import { Button, Field, GhostButton, Input } from '@/shared/ui/Ui';
import { onFormSubmit } from '@/shared/helpers/SubmitForm';
import type { PublicBookingCustomerStepProps } from '@/packages/public/types/PublicAppointment/PublicAppointmentTypes';

export function PublicBookingCustomerStep({
  captchaRequired,
  submitting,
  errorMessage,
  onBack,
  onSubmit,
}: PublicBookingCustomerStepProps) {
  const form = usePublicAppointmentFormHook();

  return (
    <section className="mt-6 flex flex-col gap-3">
      <h2 className="text-lg font-medium">Seus dados</h2>
      <form className="flex flex-col gap-3" onSubmit={onFormSubmit(form.handleSubmit, onSubmit)}>
        <Field label="Nome" error={form.formState.errors.name?.message}>
          <Input autoComplete="name" className="min-h-11" {...form.register('name')} />
        </Field>
        <Field label="Telefone" error={form.formState.errors.phone?.message}>
          <Input type="tel" autoComplete="tel" inputMode="tel" className="min-h-11" {...form.register('phone')} />
        </Field>
        <Field label="E-mail (opcional)" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" className="min-h-11" {...form.register('email')} />
        </Field>
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          {...form.register('website')}
        />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" {...form.register('consentDataProcessing')} />
          <span>
            Autorizo o tratamento dos meus dados pela rede (todas as unidades) para este agendamento.
          </span>
        </label>
        {form.formState.errors.consentDataProcessing?.message ? (
          <p className="text-xs text-red-300">{form.formState.errors.consentDataProcessing.message}</p>
        ) : null}
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" {...form.register('consentWhatsappMarketing')} />
          <span>Quero receber novidades e ofertas por WhatsApp.</span>
        </label>
        {captchaRequired ? (
          <Field label="Confirmação" error={form.formState.errors.captchaToken?.message}>
            <Input
              className="min-h-11"
              autoComplete="off"
              placeholder="Digite qualquer código para continuar"
              {...form.register('captchaToken')}
            />
          </Field>
        ) : null}
        {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}
        <div className="mt-2 flex gap-2">
          <GhostButton type="button" onClick={onBack} className="min-h-11 flex-1">
            Voltar
          </GhostButton>
          <Button type="submit" disabled={submitting} className="min-h-11 flex-1">
            {submitting ? 'Confirmando…' : 'Confirmar agendamento'}
          </Button>
        </div>
      </form>
    </section>
  );
}
