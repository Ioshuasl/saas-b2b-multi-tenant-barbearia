export type UserSummary = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  locationIds: string[];
  emailVerifiedAt: string | null;
};

export type UserFormValues = {
  role: 'OWNER' | 'MANAGER' | 'STAFF' | 'RECEPTIONIST';
  active: boolean;
  locationIds: string[];
};
