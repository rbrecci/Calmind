import { ApiError, type PatientTask } from '../api/types.ts';

export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Não foi possível concluir a ação. Tente de novo.';
  const details = Object.values(error.errors ?? {}).flat();
  return details.length ? `${error.message} ${details.join(' ')}` : error.message;
}

export function formatDateOnly(value: string | null): string {
  if (!value) return 'Sem prazo';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function orderTasks(tasks: PatientTask[]): PatientTask[] {
  return [...tasks].sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed')
    || (a.due_date ?? '').localeCompare(b.due_date ?? '') || a.id - b.id);
}
