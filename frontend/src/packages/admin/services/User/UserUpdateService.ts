import { UserUpdateData } from '@/packages/admin/data/User/UserUpdateData';
import type { UserFormValues } from '@/packages/admin/types/User/UserTypes';

export async function UserUpdateService(id: string, values: UserFormValues) {
  return UserUpdateData(id, values);
}
