export function formatPublicAddress(address: {
  street?: string;
  number?: string;
  district?: string;
  city?: string;
  state?: string;
} | null): string {
  if (!address) return '';
  const street = [address.street, address.number].filter(Boolean).join(', ');
  const city = [address.district, address.city, address.state].filter(Boolean).join(' · ');
  return [street, city].filter(Boolean).join(' — ');
}
