import type { TimeBlockSummary } from '@/packages/admin/types/TimeBlock/TimeBlockTypes';

export type TimeBlockFormDialogProps = {
  locationId: string;
  onClose: () => void;
};

export type TimeBlockTableProps = {
  blocks: TimeBlockSummary[];
  canWrite: boolean;
  onDelete: (id: string) => void;
};
