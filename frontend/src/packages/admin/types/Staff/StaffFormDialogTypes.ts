import type { StaffSummary } from '@/packages/admin/types/Staff/StaffTypes';

export type StaffFormDialogProps = {
  staff: StaffSummary | null;
  onClose: () => void;
};

export type StaffInviteFormDialogProps = {
  staffId: string;
  onClose: () => void;
};

export type StaffTableProps = {
  staff: StaffSummary[];
  locationNames: Record<string, string>;
  canWrite: boolean;
  onEdit: (staff: StaffSummary) => void;
  onInvite?: (staffId: string) => void;
};

export type StaffInviteValues = {
  email: string;
};
