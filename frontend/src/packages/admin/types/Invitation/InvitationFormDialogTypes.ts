import type { InvitationSummary } from '@/packages/admin/types/Invitation/InvitationTypes';

export type InvitationFormDialogProps = {
  onClose: () => void;
};

export type InvitationTableProps = {
  invitations: InvitationSummary[];
  onResend: (id: string) => void;
  onRevoke: (id: string) => void;
};
