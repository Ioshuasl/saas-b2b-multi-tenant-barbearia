'use client';

import { useSessionStore } from '@/shared/auth/session';
import type { LocationSummary } from '@/packages/admin/types/Location/LocationTypes';
import { Select } from '@/shared/ui/Ui';

export function LocationSwitcher({ locations }: { locations: LocationSummary[] }) {
  const locationId = useSessionStore((s) => s.locationId);
  const setLocationId = useSessionStore((s) => s.setLocationId);

  if (locations.length <= 1) return null;

  return (
    <label className="flex items-center gap-2 text-sm">
      Unidade
      <Select
        value={locationId ?? ''}
        onChange={(event) => setLocationId(event.target.value || null)}
      >
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </Select>
    </label>
  );
}
