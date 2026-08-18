import type { Metadata } from 'next';
import { PublicAppointmentManage } from '@/packages/public/components/Booking/PublicAppointmentManage';
import { loadPublicLocation } from '@/packages/public/helpers/PublicBookingLoad';

type PageProps = {
  params: Promise<{ tenantSlug: string; locationSlug: string; id: string }>;
  searchParams: Promise<{ token?: string }>;
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

export default async function PublicAppointmentPage({ params, searchParams }: PageProps) {
  const { tenantSlug, locationSlug, id } = await params;
  const { token } = await searchParams;
  return (
    <PublicAppointmentManage
      tenantSlug={tenantSlug}
      locationSlug={locationSlug}
      id={id}
      token={token ?? ''}
    />
  );
}
