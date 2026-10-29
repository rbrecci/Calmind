import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError, type PatientTask } from '../api/types.ts';
import { errorMessage, formatDateOnly, orderTasks } from './presentation.ts';

test('erros de campo chegam ao paciente e exceções internas ficam ocultas', () => {
  assert.equal(errorMessage(new ApiError(422, 'Dados inválidos.', { body: ['Escreva uma mensagem.'] })), 'Dados inválidos. Escreva uma mensagem.');
  assert.doesNotMatch(errorMessage(new Error('SQLSTATE segredo')), /SQLSTATE|segredo/);
});

test('datas sem hora não mudam de dia por causa do fuso', () => {
  assert.equal(formatDateOnly('2026-11-03'), '03/11/2026');
  assert.equal(formatDateOnly(null), 'Sem prazo');
});

test('tarefas pendentes vêm primeiro sem alterar o array original', () => {
  const task: PatientTask = { id: 1, bond_id: 8, title: 'Atividade fictícia', description: null, due_date: null, status: 'completed', completed_at: '', created_at: '' };
  const data = [task, { ...task, id: 2, status: 'pending' as const }];
  assert.deepEqual(orderTasks(data).map((t) => t.id), [2, 1]);
  assert.deepEqual(data.map((t) => t.id), [1, 2]);
});
