import { Button, Card, GhostButton } from '@/shared/ui/Ui';
import { formatDayChip, formatTimeInTimezone } from '@/packages/public/helpers/PublicBookingTime';
import type { PublicBookingSlotStepProps } from '@/packages/public/types/PublicLocation/PublicLocationTypes';

export function PublicBookingSlotStep({
  timezone,
  dayKeys,
  dayKey,
  slots,
  selectedStartsAt,
  loading,
  errorMessage,
  onDayKey,
  onPrevWindow,
  onNextWindow,
  canGoPrev,
  onSelect,
  onBack,
  onNext,
  nextLabel = 'Continuar',
  nextDisabled,
}: PublicBookingSlotStepProps) {
  return (
    <section className="mt-6 flex flex-col gap-3">
      <h2 className="text-lg font-medium">Horário</h2>
      <div className="flex items-center gap-2">
        <GhostButton type="button" onClick={onPrevWindow} disabled={!canGoPrev} className="min-h-11 px-3">
          Anterior
        </GhostButton>
        <GhostButton type="button" onClick={onNextWindow} className="min-h-11 px-3">
          Próximos 7 dias
        </GhostButton>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
        {dayKeys.map((key) => {
          const selected = key === dayKey;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              onClick={() => onDayKey(key)}
              className={`min-h-11 shrink-0 rounded-md px-3 text-sm ${
                selected ? 'bg-[var(--accent)] text-black' : 'border border-white/15'
              }`}
            >
              {formatDayChip(key, timezone)}
            </button>
          );
        })}
      </div>
      {loading ? <p className="text-sm opacity-80">Carregando horários…</p> : null}
      {errorMessage ? <p className="text-sm text-red-300">{errorMessage}</p> : null}
      {!loading && !errorMessage && slots.length === 0 ? (
        <Card>
          <p className="text-sm opacity-80">Não há horários neste dia. Tente outro dia ou profissional.</p>
        </Card>
      ) : null}
      <ul className="grid grid-cols-3 gap-2">
        {slots.map((slot) => {
          const selected = selectedStartsAt === slot.startsAt;
          return (
            <li key={`${slot.startsAt}-${slot.staffId}`}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(slot)}
                className={`min-h-11 w-full rounded-md border text-sm ${
                  selected ? 'border-[var(--accent)] bg-[var(--accent)] text-black' : 'border-white/15'
                }`}
              >
                {formatTimeInTimezone(slot.startsAt, timezone)}
              </button>
            </li>
          );
        })}
      </ul>
      {selectedStartsAt ? (
        <p className="text-sm opacity-80">
          Horário escolhido: {formatTimeInTimezone(selectedStartsAt, timezone)}
        </p>
      ) : null}
      <div className="mt-2 flex gap-2">
        <GhostButton type="button" onClick={onBack} className="min-h-11 flex-1">
          Voltar
        </GhostButton>
        {onNext ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={nextDisabled ?? !selectedStartsAt}
            className="min-h-11 flex-1"
          >
            {nextLabel}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
