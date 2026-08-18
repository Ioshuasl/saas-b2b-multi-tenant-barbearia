import type { Metadata } from 'next';
import { PublicLocationIndex } from '@/packages/public/components/Booking/PublicLocationIndex';
import { loadPublicLocation } from '@/packages/public/helpers/PublicBookingLoad';

type PageProps = {
  params: Promise<{ tenantSlug: string; locationSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tenantSlug, locationSlug } = await params;
  try {
    const location = await loadPublicLocation(tenantSlug, locationSlug);
    return { title: location.name };
  } catch {
    return { title: 'Agenda da barbearia' };
  }
}

export default async function PublicLocationPage({ params }: PageProps) {
  const { tenantSlug, locationSlug } = await params;
  return <PublicLocationIndex tenantSlug={tenantSlug} locationSlug={locationSlug} />;
}
