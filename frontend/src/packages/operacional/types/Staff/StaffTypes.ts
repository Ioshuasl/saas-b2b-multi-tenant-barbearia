export type StaffSummary = {
  id: string;
  name: string;
  photoUrl: string | null;
  homeLocationId: string;
  active: boolean;
  locationIds: string[];
  serviceIds: string[];
};
