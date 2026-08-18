'use client';

import { useEffect, useId, useState } from 'react';
import { useCustomerListHook } from '@/packages/operacional/hooks/Customer/useCustomerListHook';
import type { CustomerPickerProps } from '@/packages/operacional/types/Customer/CustomerPickerTypes';
import { Input } from '@/shared/ui/Ui';

export function CustomerPicker({ valueId, valueLabel, onSelect, disabled }: CustomerPickerProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(valueLabel ?? '');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setInput(valueLabel ?? '');
  }, [valueLabel, valueId]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const list = useCustomerListHook(
    { search: search || undefined, limit: 8 },
    { enabled: open && search.length >= 2 },
  );
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="relative">
      <Input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={input}
        disabled={disabled}
        placeholder="Buscar cliente por nome ou telefone"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setInput(event.target.value);
          setOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
      />
      {open && search.length >= 2 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-white/15 bg-[#0f1115] py-1 text-sm"
        >
          {list.isLoading ? (
            <li className="px-3 py-2 opacity-70">Buscando…</li>
          ) : null}
          {list.isError ? (
            <li className="px-3 py-2 text-red-300">Não foi possível buscar.</li>
          ) : null}
          {!list.isLoading && !list.isError && items.length === 0 ? (
            <li className="px-3 py-2 opacity-70">Nenhum cliente encontrado.</li>
          ) : null}
          {items.map((customer) => (
            <li key={customer.id} role="option" aria-selected={customer.id === valueId}>
              <button
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-white/10"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(customer);
                  setInput(customer.name);
                  setOpen(false);
                }}
              >
                <span className="font-semibold">{customer.name}</span>
                <span className="opacity-70">{customer.phone}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
