import type { UserSummary } from '@/packages/admin/types/User/UserTypes';

export type UserFormDialogProps = {
  user: UserSummary;
  onClose: () => void;
};

export type UserTableProps = {
  users: UserSummary[];
  onEdit: (user: UserSummary) => void;
};
