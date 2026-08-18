import { Button, GhostButton } from '@/shared/ui/Ui';
import type { PublicBookingStaffStepProps } from '@/packages/public/types/PublicLocation/PublicLocationTypes';

export function PublicBookingStaffStep({
  staff,
  staffId,
  onSelect,
  onBack,
  onNext,
}: PublicBookingStaffStepProps) {
  const chosen = staffId !== undefined;

  return (
    <section className="mt-6 flex flex-col gap-3">
      <h2 className="text-lg font-medium">Profissional</h2>
      <ul className="flex flex-col gap-2">
        <li>
          <button
            type="button"
            aria-pressed={staffId === null}
            onClick={() => onSelect(null)}
            className={`w-full rounded-xl border p-4 text-left ${
              staffId === null ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-white/10 bg-white/5'
            }`}
          >
            <span className="block font-medium">Qualquer profissional</span>
            <span className="mt-1 block text-sm opacity-80">O primeiro disponível no horário</span>
          </button>
        </li>
        {staff.map((person) => {
          const selected = staffId === person.id;
          return (
            <li key={person.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(person.id)}
                className={`w-full min-h-11 rounded-xl border p-4 text-left ${
                  selected ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-white/10 bg-white/5'
                }`}
              >
                {person.name}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex gap-2">
        <GhostButton type="button" onClick={onBack} className="min-h-11 flex-1">
          Voltar
        </GhostButton>
        <Button type="button" onClick={onNext} disabled={!chosen} className="min-h-11 flex-1">
          Continuar
        </Button>
      </div>
    </section>
  );
}
