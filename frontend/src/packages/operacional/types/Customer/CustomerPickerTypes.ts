import type { CustomerSummary } from '@/packages/operacional/types/Customer/CustomerTypes';

export type CustomerPickerProps = {
  valueId?: string | null;
  valueLabel?: string;
  onSelect: (customer: CustomerSummary) => void;
  disabled?: boolean;
};
