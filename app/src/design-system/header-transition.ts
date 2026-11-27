// A faixa de retorno evita alternância por pequenos movimentos na fronteira.
export function nextHeaderState(offset: number, expandedHeight: number, compact: boolean): boolean {
  if (expandedHeight <= 0) return false;
  return compact ? offset > expandedHeight - 32 : offset >= expandedHeight - 2;
}

// Ao parar depois da metade do destaque, completa a transição para a tela de conteúdo.
export function shouldCompleteHeaderScroll(offset: number, expandedHeight: number): boolean {
  return expandedHeight > 0 && offset >= expandedHeight * 0.5 && offset < expandedHeight - 2;
}
