// Contagem de não lidas em texto. O feminino serve para mensagem e para notificação.
export function formatUnread(count: number): string {
  if (count === 0) return 'nenhuma não lida';
  return count === 1 ? '1 não lida' : `${count} não lidas`;
}

// Contador da aba. Some na aba aberta: a lista já está na frente da pessoa, e o número só
// voltaria a valer depois da próxima busca.
export function tabBadge(count: number | undefined, active: boolean): number | undefined {
  return !active && count ? count : undefined;
}
