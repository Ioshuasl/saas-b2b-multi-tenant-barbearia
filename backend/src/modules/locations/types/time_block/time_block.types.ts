export type TimeBlockSummary = {
  id: string;
  locationId: string;
  staffId: string | null;
  startsAt: string;
  endsAt: string;
  reason: string;
  rrule: string | null;
  conflicts: never[];
};
