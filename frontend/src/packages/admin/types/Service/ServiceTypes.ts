export type ServiceSummary = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  priceCents: number;
  color: string | null;
  active: boolean;
  visibleOnline: boolean;
  sortOrder: number;
};

export type ServiceFormValues = {
  name: string;
  description: string;
  durationMinutes: number;
  bufferMinutes: number;
  priceReais: number;
  visibleOnline: boolean;
  active: boolean;
};
