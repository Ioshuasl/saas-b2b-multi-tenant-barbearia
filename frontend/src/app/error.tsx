'use client';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6">
      <p>Algo deu errado. Recarregue a página.</p>
      <button type="button" className="underline" onClick={() => reset()}>
        Tentar de novo
      </button>
    </main>
  );
}
