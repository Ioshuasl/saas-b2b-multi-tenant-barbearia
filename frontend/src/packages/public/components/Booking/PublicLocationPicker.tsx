'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/shared/ui/Ui';
import { formatPublicAddress } from '@/packages/public/helpers/PublicBookingAddress';
import { formatDistanceKm, haversineKm } from '@/packages/public/helpers/PublicBookingGeo';
import type { PublicLocationPickerProps } from '@/packages/public/types/PublicTenant/PublicTenantTypes';
import type { PublicLocation } from '@repo/contracts';

type Geo = { latitude: number; longitude: number } | null;

function locationDistanceKm(location: PublicLocation, geo: Geo): number | null {
  if (!geo || location.latitude == null || location.longitude == null) return null;
  return haversineKm(geo, { latitude: location.latitude, longitude: location.longitude });
}

export function PublicLocationPicker({ tenant }: PublicLocationPickerProps) {
  const [geo, setGeo] = useState<Geo>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 300_000 },
    );
  }, []);

  const locations = useMemo(() => {
    const items = tenant.locations.map((location) => ({
      location,
      km: locationDistanceKm(location, geo),
    }));
    return items.sort((a, b) => {
      if (a.km != null && b.km != null) return a.km - b.km;
      if (a.km != null) return -1;
      if (b.km != null) return 1;
      return a.location.name.localeCompare(b.location.name, 'pt-BR');
    });
  }, [tenant.locations, geo]);

  return (
    <ul className="mt-6 flex flex-col gap-3">
      {locations.map(({ location, km }) => {
        const address = formatPublicAddress(location.address);
        return (
          <li key={location.id}>
            <Link href={`/${tenant.slug}/${location.slug}`} className="block">
              <Card className="flex flex-col gap-1 p-4">
                <span className="text-lg font-medium">{location.name}</span>
                {address ? <span className="text-sm opacity-80">{address}</span> : null}
                {km != null ? (
                  <span className="text-sm text-[var(--accent)]">{formatDistanceKm(km)}</span>
                ) : null}
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
