import type { LocationSummary } from '@/packages/admin/types/Location/LocationTypes';

export type LocationFormDialogProps = {
  location: LocationSummary | null;
  onClose: () => void;
};

export type LocationTableProps = {
  locations: LocationSummary[];
  canWrite: boolean;
  onEdit: (location: LocationSummary) => void;
};
