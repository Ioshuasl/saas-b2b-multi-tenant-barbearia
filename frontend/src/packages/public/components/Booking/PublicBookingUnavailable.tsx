export function PublicBookingUnavailable({ title }: { title: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-3 p-6">
      <p className="text-sm tracking-wide text-[var(--accent)]">Agendar</p>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-sm opacity-80">Agendamento indisponível.</p>
    </main>
  );
}
