export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}
