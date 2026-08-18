export type TimeBlockConflict = {
  id: string;
  locationId: string;
  staffId: string;
  startsAt: string;
  endsAt: string;
  status: string;
};

export type TimeBlockSummary = {
  id: string;
  locationId: string;
  staffId: string | null;
  startsAt: string;
  endsAt: string;
  reason: string;
  rrule: string | null;
  conflicts: TimeBlockConflict[];
};
