import type { CustomerSummary } from '@/packages/operacional/types/Customer/CustomerTypes';

export type CustomerInactivateDialogProps = {
  customer: CustomerSummary;
  onClose: () => void;
  onInactivated?: () => void;
};
