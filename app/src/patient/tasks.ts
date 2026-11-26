import type { PatientTask } from '../api/types.ts';
import { orderTasks } from './presentation.ts';

// CA-25.1: pendentes e concluídas em seções separadas, cada uma na ordem do prazo.
export function splitTasks(tasks: PatientTask[]): { pending: PatientTask[]; completed: PatientTask[] } {
  const ordered = orderTasks(tasks);
  return { pending: ordered.filter((t) => t.status === 'pending'), completed: ordered.filter((t) => t.status === 'completed') };
}
