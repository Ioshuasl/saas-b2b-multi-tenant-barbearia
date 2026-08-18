export type BusinessHoursSlot = {
  weekday: number;
  startsAt: string;
  endsAt: string;
};

export type BusinessHoursView = {
  locationId: string;
  staffId: string | null;
  slots: BusinessHoursSlot[];
};
