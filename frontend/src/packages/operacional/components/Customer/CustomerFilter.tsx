'use client';

import type { CustomerFilterProps } from '@/packages/operacional/types/Customer/CustomerFilterTypes';
import { Input } from '@/shared/ui/Ui';

export function CustomerFilter({ search, onSearchChange }: CustomerFilterProps) {
  return (
    <Input
      value={search}
      onChange={(event) => onSearchChange(event.target.value)}
      placeholder="Buscar por nome ou telefone"
      aria-label="Buscar por nome ou telefone"
    />
  );
}
