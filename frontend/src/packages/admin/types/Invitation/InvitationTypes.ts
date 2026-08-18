export type InvitationSummary = {
  id: string;
  email: string;
  role: string;
  locationIds: string[];
  expiresAt: string;
  acceptedAt: string | null;
  invitedBy: string;
  createdAt: string;
};

export type InvitationFormValues = {
  email: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF' | 'RECEPTIONIST';
  locationIds: string[];
};
