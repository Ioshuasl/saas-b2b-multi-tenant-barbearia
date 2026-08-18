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

export type BusinessHoursRow = {
  weekday: number;
  enabled: boolean;
  startsAt: string;
  endsAt: string;
};

export type BusinessHoursFormValues = {
  slots: BusinessHoursRow[];
};
