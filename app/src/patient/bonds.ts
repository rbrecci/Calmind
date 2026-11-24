import type { PatientBond } from '../api/patient/types.ts';

export function selectBond(bonds: PatientBond[]): PatientBond | null {
  const order = { active: 0, pending: 1, ended: 2 };
  return [...bonds].sort((a, b) => order[a.status] - order[b.status] || b.id - a.id)[0] ?? null;
}

// Encerrado sem accepted_at nunca ficou ativo: o psicólogo recusou (responded_at preenchido)
// ou o paciente cancelou antes da resposta (BondService::cancelRequest não preenche responded_at).
function neverAccepted(bond: PatientBond): boolean {
  return bond.status === 'ended' && !bond.accepted_at;
}

export function bondStatusText(bond: PatientBond): string {
  if (bond.status === 'active') return 'Seu acompanhamento está ativo.';
  if (bond.status === 'pending') return 'Aguardando resposta do profissional';
  if (neverAccepted(bond)) return bond.responded_at === null ? 'Solicitação cancelada.' : 'Solicitação recusada.';
  return 'Vínculo encerrado. O histórico está disponível somente para leitura.';
}

// Pedido que nunca foi aceito não tem conversa para reabrir.
export function bondsWithConversation(bonds: PatientBond[]): PatientBond[] {
  return bonds.filter((b) => b.status !== 'pending' && !neverAccepted(b));
}

// Conversa encerrada também guarda mensagem não lida, e ela continua legível.
export function unreadMessages(bonds: PatientBond[]): number {
  return bonds.reduce((total, b) => total + b.unread_messages, 0);
}
