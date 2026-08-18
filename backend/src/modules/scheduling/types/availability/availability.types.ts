export type AvailabilitySlot = {
  startsAt: string;
  endsAt: string;
  staffId: string;
  staffName: string;
};

export type AvailabilityResult = {
  slots: AvailabilitySlot[];
  timezone: string;
};
