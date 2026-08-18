export type StaffSummary = {
  id: string;
  name: string;
  photoUrl: string | null;
  bio: string | null;
  homeLocationId: string;
  userId: string | null;
  commissionPercent: number;
  acceptsOnlineBooking: boolean;
  active: boolean;
  locationIds: string[];
  serviceIds: string[];
};

export type StaffFormValues = {
  name: string;
  homeLocationId: string;
  bio: string;
  commissionPercent: number;
  acceptsOnlineBooking: boolean;
  active: boolean;
  locationIds: string[];
  serviceIds: string[];
};
