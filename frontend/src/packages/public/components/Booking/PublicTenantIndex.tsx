import { notFound, redirect } from 'next/navigation';
import { PublicBookingHeader } from '@/packages/public/components/Booking/PublicBookingHeader';
import { PublicBookingLoadError } from '@/packages/public/components/Booking/PublicBookingLoadError';
import { PublicBookingUnavailable } from '@/packages/public/components/Booking/PublicBookingUnavailable';
import { PublicLocationPicker } from '@/packages/public/components/Booking/PublicLocationPicker';
import { loadPublicTenant } from '@/packages/public/helpers/PublicBookingLoad';
import { isPublicNotFoundError } from '@/packages/public/helpers/PublicBookingNotFound';
import type { PublicTenantIndexProps } from '@/packages/public/types/PublicTenant/PublicTenantTypes';

export async function PublicTenantIndex({ tenantSlug }: PublicTenantIndexProps) {
  try {
    const tenant = await loadPublicTenant(tenantSlug);
    if (tenant.locations.length === 0) {
      return <PublicBookingUnavailable title={tenant.name} />;
    }
    const only = tenant.locations[0];
    if (tenant.locations.length === 1 && only) {
      redirect(`/${tenant.slug}/${only.slug}`);
    }

    return (
      <main className="mx-auto min-h-dvh max-w-lg px-4 py-6">
        <PublicBookingHeader
          title={tenant.name}
          description="Escolha a unidade"
          logoUrl={tenant.logoUrl}
        />
        <PublicLocationPicker tenant={tenant} />
      </main>
    );
  } catch (err) {
    if (isPublicNotFoundError(err)) notFound();
    return <PublicBookingLoadError err={err} />;
  }
}
