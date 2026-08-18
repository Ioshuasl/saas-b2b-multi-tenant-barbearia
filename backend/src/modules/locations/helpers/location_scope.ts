export function inLocationScope(
  locationScope: 'ALL' | 'RESTRICTED',
  locationIds: readonly string[],
  locationId: string,
): boolean {
  return locationScope === 'ALL' || locationIds.includes(locationId);
}
