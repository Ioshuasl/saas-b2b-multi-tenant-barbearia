'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useOnboardingGetHook } from '@/packages/admin/hooks/Onboarding/useOnboardingGetHook';
import { useOnboardingUpdateHook } from '@/packages/admin/hooks/Onboarding/useOnboardingUpdateHook';
import { useLocationListHook } from '@/packages/admin/hooks/Location/useLocationListHook';
import { useServiceListHook } from '@/packages/admin/hooks/Service/useServiceListHook';
import { useStaffListHook } from '@/packages/admin/hooks/Staff/useStaffListHook';
import { BusinessHoursEditor } from '@/packages/admin/components/BusinessHours/BusinessHoursEditor';
import { ServiceTable } from '@/packages/admin/components/Service/ServiceTable';
import { ServiceFormDialog } from '@/packages/admin/components/Service/ServiceFormDialog';
import { StaffTable } from '@/packages/admin/components/Staff/StaffTable';
import { StaffFormDialog } from '@/packages/admin/components/Staff/StaffFormDialog';
import { ONBOARDING_STEPS, ONBOARDING_STEP_LABEL } from '@/packages/admin/enum/Onboarding/OnboardingStepEnum';
import { useSessionStore } from '@/shared/auth/session';
import { Button, GhostButton, PageHeader } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import type { OnboardingStep } from '@/packages/admin/types/Onboarding/OnboardingTypes';
import type { ServiceSummary } from '@/packages/admin/types/Service/ServiceTypes';
import type { StaffSummary } from '@/packages/admin/types/Staff/StaffTypes';

export function WizardForm() {
  const onboarding = useOnboardingGetHook();
  const update = useOnboardingUpdateHook();
  const locationId = useSessionStore((s) => s.locationId);
  const locations = useLocationListHook();
  const services = useServiceListHook();
  const staff = useStaffListHook();
  const [stepIndex, setStepIndex] = useState(0);
  const [serviceEdit, setServiceEdit] = useState<ServiceSummary | null | undefined>(undefined);
  const [staffEdit, setStaffEdit] = useState<StaffSummary | null | undefined>(undefined);
  const [qr, setQr] = useState<string | null>(null);
  const step = ONBOARDING_STEPS[stepIndex] ?? 'hours';
  const publicInfo = onboarding.data?.public;

  useEffect(() => {
    const url = publicInfo?.locationUrl ?? publicInfo?.tenantUrl;
    if (!url) return;
    void QRCode.toDataURL(url, { width: 192, margin: 1, color: { dark: '#0f1115', light: '#ffffff' } }).then(
      setQr,
    );
  }, [publicInfo]);

  async function completeStep(next: OnboardingStep) {
    await update.mutateAsync(next);
    if (next !== 'publish') setStepIndex((index) => Math.min(index + 1, 3));
  }

  const locationNames = Object.fromEntries(
    (locations.data ?? []).map((location) => [location.id, location.name]),
  );

  return (
    <div>
      <PageHeader
        title="Configurar loja"
        description="Quatro passos. Loja única não precisa adicionar outra unidade neste caminho."
      />
      <ol className="mb-6 flex flex-wrap gap-2 text-sm">
        {ONBOARDING_STEPS.map((item, index) => (
          <li key={item}>
            <GhostButton type="button" onClick={() => setStepIndex(index)}>
              {index + 1}. {ONBOARDING_STEP_LABEL[item]}
              {stepIndex === index ? ' ←' : ''}
            </GhostButton>
          </li>
        ))}
      </ol>

      {step === 'hours' && locationId ? (
        <section className="flex flex-col gap-4">
          <BusinessHoursEditor locationId={locationId} />
          <Button type="button" onClick={() => void completeStep('hours')} disabled={update.isPending}>
            Continuar
          </Button>
        </section>
      ) : null}

      {step === 'services' ? (
        <section className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button type="button" onClick={() => setServiceEdit(null)}>
              Novo serviço
            </Button>
          </div>
          {services.data ? (
            <ServiceTable services={services.data} canWrite onEdit={setServiceEdit} />
          ) : null}
          <Button type="button" onClick={() => void completeStep('services')} disabled={update.isPending}>
            Continuar
          </Button>
        </section>
      ) : null}

      {step === 'staff' ? (
        <section className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button type="button" onClick={() => setStaffEdit(null)}>
              Novo profissional
            </Button>
          </div>
          {staff.data ? (
            <StaffTable
              staff={staff.data}
              locationNames={locationNames}
              canWrite
              onEdit={setStaffEdit}
            />
          ) : null}
          <Button type="button" onClick={() => void completeStep('staff')} disabled={update.isPending}>
            Continuar
          </Button>
        </section>
      ) : null}

      {step === 'publish' ? (
        <section className="flex max-w-lg flex-col gap-4">
          {publicInfo ? (
            <>
              <p className="text-sm">
                Rede: <span className="font-mono">{publicInfo.tenantPath}</span>
              </p>
              <p className="text-sm">
                Unidade: <span className="font-mono">{publicInfo.locationPath}</span>
              </p>
              {qr ? <img src={qr} alt="QR da página da unidade" className="h-48 w-48 rounded-md bg-white p-2" /> : null}
              <a
                href={publicInfo.locationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--accent)] px-3 py-2 font-medium text-black"
              >
                Abrir página de agendamento
              </a>
            </>
          ) : (
            <p className="text-sm opacity-80">
              Publique para gerar o link e o QR da página de agendamento.
            </p>
          )}
          <Button type="button" onClick={() => void completeStep('publish')} disabled={update.isPending}>
            {onboarding.data?.publishedAt ? 'Atualizar publicação' : 'Publicar'}
          </Button>
        </section>
      ) : null}

      {update.isError ? <p className="mt-3 text-sm text-red-300">{apiErrorMessage(update.error)}</p> : null}
      {serviceEdit !== undefined ? (
        <ServiceFormDialog service={serviceEdit} onClose={() => setServiceEdit(undefined)} />
      ) : null}
      {staffEdit !== undefined ? (
        <StaffFormDialog staff={staffEdit} onClose={() => setStaffEdit(undefined)} />
      ) : null}
    </div>
  );
}
