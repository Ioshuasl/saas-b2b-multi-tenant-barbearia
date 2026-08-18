'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/shared/auth/session';
import {
  MESSAGING_SESSION_STATUS_LABELS,
  MessagingSessionStatus,
} from '@/packages/messaging/enum/Account/MessagingSessionStatusEnum';
import { useMessagingAccountGetHook } from '@/packages/messaging/hooks/Account/useMessagingAccountGetHook';
import { useMessagingAccountCreateHook } from '@/packages/messaging/hooks/Account/useMessagingAccountCreateHook';
import { useMessagingAccountQrHook } from '@/packages/messaging/hooks/Account/useMessagingAccountQrHook';
import { useMessagingAccountDeleteHook } from '@/packages/messaging/hooks/Account/useMessagingAccountDeleteHook';
import { MessagingConnectForm } from '@/packages/messaging/components/Account/MessagingConnectForm';
import type { MessagingAccountFormValues } from '@/packages/messaging/types/Account/MessagingAccountTypes';
import { Card, GhostButton, PageHeader } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';

export function MessagingAccountIndex() {
  const isOwner = useSessionStore((s) => s.me?.role === 'OWNER');
  const accountQuery = useMessagingAccountGetHook(isOwner);
  const create = useMessagingAccountCreateHook();
  const disconnect = useMessagingAccountDeleteHook();
  const queryClient = useQueryClient();

  const account = accountQuery.data;
  const polling =
    isOwner &&
    Boolean(account?.riskAcceptedAt) &&
    account?.status !== MessagingSessionStatus.CONNECTED;
  const qrQuery = useMessagingAccountQrHook(polling);

  useEffect(() => {
    if (qrQuery.data?.status === MessagingSessionStatus.CONNECTED) {
      void queryClient.invalidateQueries({ queryKey: ['messaging', 'account', 'get'] });
    }
  }, [qrQuery.data?.status, queryClient]);

  async function onConnect(values: MessagingAccountFormValues) {
    await create.mutateAsync(values);
  }

  const qr = qrQuery.data?.qr ?? create.data?.qr ?? null;
  const pairingCode = qrQuery.data?.pairingCode ?? create.data?.pairingCode ?? null;
  const status = qrQuery.data?.status ?? account?.status ?? null;
  const displayPhone = qrQuery.data?.displayPhone ?? account?.displayPhone ?? null;
  const connected = status === MessagingSessionStatus.CONNECTED;
  const showQr = Boolean(qr) && status === MessagingSessionStatus.PENDING;

  return (
    <div>
      <PageHeader
        title="Mensagens"
        description="Conecte um número dedicado para confirmações e lembretes. A agenda não para se a sessão cair."
      />
      {!isOwner ? (
        <p className="text-sm opacity-70">Somente o dono configura o canal de mensagens.</p>
      ) : null}
      {isOwner && accountQuery.isLoading ? (
        <p className="text-sm opacity-70">Carregando…</p>
      ) : null}
      {isOwner && accountQuery.isError ? (
        <p className="text-sm text-red-300">{apiErrorMessage(accountQuery.error)}</p>
      ) : null}
      {isOwner && !accountQuery.isLoading && !accountQuery.isError ? (
        <div className="flex max-w-xl flex-col gap-4">
          <Card>
            <p className="text-sm">
              Status:{' '}
              <span className="font-medium">
                {status ? MESSAGING_SESSION_STATUS_LABELS[status] : 'Não configurado'}
              </span>
            </p>
            {displayPhone ? <p className="mt-1 text-sm opacity-80">Número: {displayPhone}</p> : null}
            {account?.lastError ? (
              <p className="mt-2 text-sm text-red-300">Falha: {account.lastError}</p>
            ) : null}
            {account?.killSwitch ? (
              <p className="mt-2 text-sm opacity-70">Envios automáticos desligados neste tenant.</p>
            ) : null}
          </Card>

          {showQr ? (
            <Card className="flex flex-col items-start gap-3">
              <p className="text-sm">Escaneie o QR no aplicativo do número dedicado.</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr ?? ''} alt="QR para conectar o número dedicado" className="h-48 w-48 bg-white p-2" />
              {pairingCode ? (
                <p className="text-sm">
                  Código de pareamento: <span className="font-mono">{pairingCode}</span>
                </p>
              ) : null}
              <p className="text-xs opacity-60">Atualizando status automaticamente…</p>
            </Card>
          ) : null}

          {!connected && !showQr ? (
            <MessagingConnectForm
              pending={create.isPending}
              error={create.error}
              onConnect={onConnect}
            />
          ) : null}

          {account ? (
            <GhostButton
              type="button"
              className="self-start"
              disabled={disconnect.isPending}
              onClick={() => disconnect.mutate()}
            >
              {disconnect.isPending ? 'Desconectando…' : 'Desconectar'}
            </GhostButton>
          ) : null}
          {disconnect.isError ? (
            <p className="text-sm text-red-300">{apiErrorMessage(disconnect.error)}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
