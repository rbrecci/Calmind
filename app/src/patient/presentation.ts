import { ApiError, type PatientTask } from '../api/types.ts';

export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Não foi possível concluir a ação. Tente de novo.';
  const details = Object.values(error.errors ?? {}).flat();
  return details.length ? `${error.message} ${details.join(' ')}` : error.message;
}

export function orderTasks(tasks: PatientTask[]): PatientTask[] {
  return [...tasks].sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed')
    || (a.due_date ?? '').localeCompare(b.due_date ?? '') || a.id - b.id);
}

// Primeiro nome da saudação do início. Sem nome, a tela diz só "Olá!", sem vírgula solta.
export function firstName(name: string | null): string | null {
  return name?.trim().split(/\s+/)[0] || null;
}
