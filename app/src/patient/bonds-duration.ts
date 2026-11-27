// O servidor conta os dias; aqui só vira frase.
export function bondDuration(days: number | null | undefined): string | null {
  if (days === null || days === undefined) return null;
  if (days === 0) return 'Começou hoje';
  return days === 1 ? '1 dia' : `${days} dias`;
}
