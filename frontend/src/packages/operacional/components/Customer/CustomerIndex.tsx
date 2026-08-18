'use client';

import { useEffect, useState } from 'react';
import { useCustomerListHook } from '@/packages/operacional/hooks/Customer/useCustomerListHook';
import { CustomerFilter } from '@/packages/operacional/components/Customer/CustomerFilter';
import { CustomerTable } from '@/packages/operacional/components/Customer/CustomerTable';
import { CustomerFormDialog } from '@/packages/operacional/components/Customer/CustomerFormDialog';
import { CustomerInactivateDialog } from '@/packages/operacional/components/Customer/CustomerInactivateDialog';
import { useSessionStore } from '@/shared/auth/session';
import { Button, Card, GhostButton, PageHeader } from '@/shared/ui/Ui';
import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';
import type { CustomerSummary } from '@/packages/operacional/types/Customer/CustomerTypes';

export function CustomerIndex() {
  const canWrite = useSessionStore((s) => s.me?.permissions.includes('customers.write') ?? false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CustomerSummary | null | undefined>(undefined);
  const [inactivating, setInactivating] = useState<CustomerSummary | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const list = useCustomerListHook({
    search: search || undefined,
    limit: 50,
  });
  const customers = list.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Busca por nome ou telefone. A base é única na rede."
        action={
          canWrite ? (
            <Button type="button" onClick={() => setEditing(null)}>
              Novo cliente
            </Button>
          ) : null
        }
      />
      <Card>
        <div className="mb-4 max-w-md">
          <CustomerFilter search={searchInput} onSearchChange={setSearchInput} />
        </div>
        {list.isLoading ? (
          <div className="flex flex-col gap-2" aria-busy="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-9 animate-pulse rounded-md bg-white/10" />
            ))}
          </div>
        ) : null}
        {list.isError ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-red-300">{apiErrorMessage(list.error)}</p>
            <GhostButton type="button" onClick={() => void list.refetch()}>
              Tentar de novo
            </GhostButton>
          </div>
        ) : null}
        {!list.isLoading && !list.isError && customers.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm opacity-70">
              {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
            </p>
            {canWrite && !search ? (
              <Button type="button" onClick={() => setEditing(null)}>
                Novo cliente
              </Button>
            ) : null}
          </div>
        ) : null}
        {!list.isLoading && !list.isError && customers.length > 0 ? (
          <>
            <CustomerTable
              customers={customers}
              canWrite={canWrite}
              onEdit={setEditing}
              onInactivate={setInactivating}
            />
            {list.hasNextPage ? (
              <div className="mt-4">
                <GhostButton
                  type="button"
                  onClick={() => void list.fetchNextPage()}
                  disabled={list.isFetchingNextPage}
                >
                  {list.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
                </GhostButton>
              </div>
            ) : null}
          </>
        ) : null}
      </Card>
      {editing !== undefined ? (
        <CustomerFormDialog customer={editing} onClose={() => setEditing(undefined)} />
      ) : null}
      {inactivating ? (
        <CustomerInactivateDialog customer={inactivating} onClose={() => setInactivating(null)} />
      ) : null}
    </div>
  );
}
