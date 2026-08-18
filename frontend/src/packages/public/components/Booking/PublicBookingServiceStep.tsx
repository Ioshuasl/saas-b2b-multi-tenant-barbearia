import { Button, Card } from '@/shared/ui/Ui';
import { formatBRL } from '@/shared/helpers/Money';
import type { PublicBookingServiceStepProps } from '@/packages/public/types/PublicLocation/PublicLocationTypes';

export function PublicBookingServiceStep({
  location,
  serviceIds,
  onToggle,
  onNext,
}: PublicBookingServiceStepProps) {
  return (
    <section className="mt-6 flex flex-col gap-3">
      <h2 className="text-lg font-medium">Serviço</h2>
      <ul className="flex flex-col gap-2">
        {location.services.map((service) => {
          const selected = serviceIds.includes(service.id);
          return (
            <li key={service.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onToggle(service.id)}
                className={`w-full rounded-xl border p-4 text-left ${
                  selected ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <span className="block font-medium">{service.name}</span>
                <span className="mt-1 block text-sm opacity-80">
                  {service.durationMinutes} min · {formatBRL(service.priceCents)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {location.services.length === 0 ? (
        <Card>
          <p className="text-sm opacity-80">Agendamento indisponível.</p>
        </Card>
      ) : null}
      <Button type="button" onClick={onNext} disabled={serviceIds.length === 0} className="mt-2 min-h-11">
        Continuar
      </Button>
    </section>
  );
}
