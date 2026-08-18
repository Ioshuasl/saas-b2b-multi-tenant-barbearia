'use client';

import Link from 'next/link';
import { useSessionStore } from '@/shared/auth/session';
import { MessagingSessionStatus } from '@/packages/messaging/enum/Account/MessagingSessionStatusEnum';
import { useMessagingAccountGetHook } from '@/packages/messaging/hooks/Account/useMessagingAccountGetHook';

export function MessagingSessionBanner() {
  const canRead = useSessionStore((s) => s.me?.permissions.includes('messaging.read') ?? false);
  const canConfigure = useSessionStore(
    (s) => s.me?.permissions.includes('messaging.configure') ?? false,
  );
  const accountQuery = useMessagingAccountGetHook(canRead);

  if (!canRead || accountQuery.isLoading || accountQuery.isError) return null;

  const account = accountQuery.data;
  const connected =
    account?.status === MessagingSessionStatus.CONNECTED && account.killSwitch === false;
  if (connected) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-400/30 bg-amber-400/10 px-6 py-3 text-sm"
    >
      Canal de mensagens desconectado. A agenda continua funcionando; confirmações saem por
      e-mail até reconectar.
      {canConfigure ? (
        <>
          {' '}
          <Link href="/configuracoes/whatsapp" className="underline">
            Reconectar
          </Link>
        </>
      ) : null}
    </div>
  );
}
