import { notFound } from 'next/navigation';
import { PublicAppointmentManagePanel } from '@/packages/public/components/Booking/PublicAppointmentManagePanel';
import { PublicBookingHeader } from '@/packages/public/components/Booking/PublicBookingHeader';
import { PublicBookingLoadError } from '@/packages/public/components/Booking/PublicBookingLoadError';
import { loadPublicLocation, loadPublicTenant } from '@/packages/public/helpers/PublicBookingLoad';
import { isPublicNotFoundError } from '@/packages/public/helpers/PublicBookingNotFound';
import type { PublicAppointmentManageProps } from '@/packages/public/types/PublicAppointment/PublicAppointmentTypes';

export async function PublicAppointmentManage({
  tenantSlug,
  locationSlug,
  id,
  token,
}: PublicAppointmentManageProps) {
  if (!token) notFound();

  try {
    const [tenant, location] = await Promise.all([
      loadPublicTenant(tenantSlug),
      loadPublicLocation(tenantSlug, locationSlug),
    ]);

    return (
      <main className="mx-auto min-h-dvh max-w-lg px-4 py-6">
        <PublicBookingHeader
          title={location.name}
          description={tenant.name}
          logoUrl={tenant.logoUrl}
        />
        <PublicAppointmentManagePanel
          tenantSlug={tenant.slug}
          location={location}
          id={id}
          token={token}
        />
      </main>
    );
  } catch (err) {
    if (isPublicNotFoundError(err)) notFound();
    return <PublicBookingLoadError err={err} />;
  }
}
