import { apiErrorMessage } from '@/shared/helpers/ApiErrorMessage';

export function PublicBookingLoadError({ err }: { err: unknown }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-3 p-6">
      <h1 className="text-2xl font-semibold">Não foi possível abrir a agenda</h1>
      <p className="text-sm opacity-80">{apiErrorMessage(err)}</p>
    </main>
  );
}
