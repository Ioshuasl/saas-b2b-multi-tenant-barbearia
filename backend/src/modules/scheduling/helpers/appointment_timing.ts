/** Soma durações (minutos) e calcula `endsAt` exclusivo [startsAt, endsAt). */
export function calculateEndsAt(startsAt: Date, totalDurationMinutes: number): Date {
  return new Date(startsAt.getTime() + totalDurationMinutes * 60_000);
}

export function sumDurationMinutes(lines: readonly { durationMinutes: number }[]): number {
  return lines.reduce((acc, line) => acc + line.durationMinutes, 0);
}

export function sumPriceCents(lines: readonly { priceCents: bigint }[]): bigint {
  return lines.reduce((acc, line) => acc + line.priceCents, 0n);
}

export function buildCalculatedSlot(
  startsAt: Date,
  lines: readonly { priceCents: bigint; durationMinutes: number }[],
): { endsAt: Date; totalPriceCents: bigint; totalDurationMinutes: number } {
  const totalDurationMinutes = sumDurationMinutes(lines);
  const totalPriceCents = sumPriceCents(lines);
  const endsAt = calculateEndsAt(startsAt, totalDurationMinutes);
  return { endsAt, totalPriceCents, totalDurationMinutes };
}
