'use client';

import { useCustomerDeleteHook } from '@/packages/operacional/hooks/Customer/useCustomerDeleteHook';
import type { CustomerInactivateDialogProps } from '@/packages/operacional/types/Customer/CustomerInactivateDialogTypes';
import { Dialog } from '@/shared/ui/Dialog';
import { Button, GhostButton } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';

export function CustomerInactivateDialog({
  customer,
  onClose,
  onInactivated,
}: CustomerInactivateDialogProps) {
  const inactivate = useCustomerDeleteHook();

  async function onConfirm() {
    await inactivate.mutateAsync(customer.id);
    onInactivated?.();
    onClose();
  }

  return (
    <Dialog title="Inativar cliente" onClose={onClose}>
      <p className="text-sm opacity-80">
        {customer.name} será inativado. O histórico de atendimentos permanece na rede para operação
        e obrigações legais. Isto não apaga o cadastro — faz parte do fluxo de privacidade (LGPD).
      </p>
      {inactivate.isError ? (
        <p className="mt-3 text-sm text-red-300">{apiErrorMessage(inactivate.error)}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => void onConfirm()} disabled={inactivate.isPending}>
          {inactivate.isPending ? 'Inativando…' : 'Inativar cliente'}
        </Button>
        <GhostButton type="button" onClick={onClose} disabled={inactivate.isPending}>
          Cancelar
        </GhostButton>
      </div>
    </Dialog>
  );
}
