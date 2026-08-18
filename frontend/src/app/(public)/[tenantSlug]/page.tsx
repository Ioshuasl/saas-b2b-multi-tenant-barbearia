import type { Metadata } from 'next';
import { PublicTenantIndex } from '@/packages/public/components/Booking/PublicTenantIndex';
import { loadPublicTenant } from '@/packages/public/helpers/PublicBookingLoad';

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tenantSlug } = await params;
  try {
    const tenant = await loadPublicTenant(tenantSlug);
    return { title: tenant.name };
  } catch {
    return { title: 'Agenda da barbearia' };
  }
}

export default async function PublicTenantPage({ params }: PageProps) {
  const { tenantSlug } = await params;
  return <PublicTenantIndex tenantSlug={tenantSlug} />;
}
