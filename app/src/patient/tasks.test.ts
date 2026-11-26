import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { PatientTask } from '../api/types.ts';
import { splitTasks } from './tasks.ts';

const base: PatientTask = { id: 1, bond_id: 8, title: 'Atividade fictícia', description: null, due_date: '2026-11-10', status: 'pending', completed_at: null, created_at: '' };

test('pendentes e concluídas ficam em listas separadas, cada uma pelo prazo', () => {
  const tasks: PatientTask[] = [
    { ...base, id: 1, status: 'completed', completed_at: '2026-11-01T10:00:00-03:00', due_date: '2026-11-05' },
    { ...base, id: 2, due_date: '2026-11-20' },
    { ...base, id: 3, due_date: '2026-11-08' },
    { ...base, id: 4, status: 'completed', completed_at: '2026-11-02T10:00:00-03:00', due_date: '2026-11-01' },
  ];
  const { pending, completed } = splitTasks(tasks);
  assert.deepEqual(pending.map((t) => t.id), [3, 2]);
  assert.deepEqual(completed.map((t) => t.id), [4, 1]);
  assert.deepEqual(tasks.map((t) => t.id), [1, 2, 3, 4]);
});

test('sem tarefas, as duas listas ficam vazias', () => {
  assert.deepEqual(splitTasks([]), { pending: [], completed: [] });
});
