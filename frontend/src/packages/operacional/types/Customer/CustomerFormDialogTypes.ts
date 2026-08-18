import type { CustomerSummary } from '@/packages/operacional/types/Customer/CustomerTypes';

export type CustomerFormDialogProps = {
  customer: CustomerSummary | null;
  onClose: () => void;
};
