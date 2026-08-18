import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicBookingHeader } from '@/packages/public/components/Booking/PublicBookingHeader';
import { PublicBookingLoadError } from '@/packages/public/components/Booking/PublicBookingLoadError';
import { PublicBookingUnavailable } from '@/packages/public/components/Booking/PublicBookingUnavailable';
import { PublicBookingWizard } from '@/packages/public/components/Booking/PublicBookingWizard';
import { loadPublicLocation, loadPublicTenant } from '@/packages/public/helpers/PublicBookingLoad';
import { isPublicNotFoundError } from '@/packages/public/helpers/PublicBookingNotFound';
import type { PublicLocationIndexProps } from '@/packages/public/types/PublicLocation/PublicLocationTypes';

export async function PublicLocationIndex({ tenantSlug, locationSlug }: PublicLocationIndexProps) {
  try {
    const [tenant, location] = await Promise.all([
      loadPublicTenant(tenantSlug),
      loadPublicLocation(tenantSlug, locationSlug),
    ]);

    if (!location.bookingAvailable) {
      return <PublicBookingUnavailable title={location.name} />;
    }

    return (
      <main className="mx-auto min-h-dvh max-w-lg px-4 py-6">
        <PublicBookingHeader
          title={location.name}
          description={tenant.name}
          logoUrl={tenant.logoUrl}
        />
        {tenant.locations.length > 1 ? (
          <Link href={`/${tenant.slug}`} className="mt-3 inline-block text-sm underline opacity-80">
            Trocar unidade
          </Link>
        ) : null}
        <PublicBookingWizard tenantSlug={tenant.slug} location={location} />
      </main>
    );
  } catch (err) {
    if (isPublicNotFoundError(err)) notFound();
    return <PublicBookingLoadError err={err} />;
  }
}
