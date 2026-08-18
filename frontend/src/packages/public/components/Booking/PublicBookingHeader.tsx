import type { PublicBookingHeaderProps } from '@/packages/public/types/PublicLocation/PublicLocationTypes';

export function PublicBookingHeader({ title, description, logoUrl }: PublicBookingHeaderProps) {
  return (
    <header className="flex items-center gap-3">
      {logoUrl ? (
        <img src={logoUrl} alt="" width={48} height={48} className="h-12 w-12 rounded-md object-cover" />
      ) : null}
      <div>
        <p className="text-sm tracking-wide text-[var(--accent)]">Agendar</p>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description ? <p className="mt-1 text-sm opacity-80">{description}</p> : null}
      </div>
    </header>
  );
}
