import type { CustomerSummary } from '@/packages/operacional/types/Customer/CustomerTypes';

export type CustomerTableProps = {
  customers: CustomerSummary[];
  canWrite: boolean;
  onEdit: (customer: CustomerSummary) => void;
  onInactivate: (customer: CustomerSummary) => void;
};
