import type { ServiceSummary } from '@/packages/admin/types/Service/ServiceTypes';

export type ServiceFormDialogProps = {
  service: ServiceSummary | null;
  onClose: () => void;
};

export type ServiceTableProps = {
  services: ServiceSummary[];
  canWrite: boolean;
  onEdit: (service: ServiceSummary) => void;
};
