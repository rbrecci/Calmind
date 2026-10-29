import assert from 'node:assert/strict';
import { test } from 'node:test';
import { notificationDestination, notificationRoute, notificationText } from './notifications.ts';
import { ApiError } from '../api/types.ts';
import type { PatientBond, PatientNotification } from '../api/patient/types.ts';

test('notificações mostram somente tipo e destino, sem conteúdo clínico', () => {
  assert.equal(notificationText('message.received'), 'Você recebeu uma mensagem');
  assert.equal(notificationDestination('message.received'), '/chat');
  assert.equal(notificationDestination('task.assigned'), '/tasks');
  assert.equal(notificationDestination('appointment.cancelled'), '/agenda');
  assert.equal(notificationDestination('bond.accepted'), '/home');
  assert.equal(notificationDestination('appointment.future_unknown'), '/notifications');
  assert.equal(notificationText('segredo clínico'), 'Você tem uma nova notificação');
  assert.equal(notificationDestination('segredo clínico'), '/notifications');
});

test('notificação antiga abre o vínculo da mensagem, mesmo com outro vínculo ativo', async () => {
  const bond: PatientBond = { id: 8, status: 'ended', origin: 'catalog', requested_at: '', responded_at: null, ended_at: '', unread_messages: 0, psychologist: { id: 1, name: 'Profissional fictício', crp: '06/000001' } };
  const notification: PatientNotification = { id: 5, type: 'message.received', resource_id: 40, created_at: '', read_at: null };
  const queries: unknown[] = [];
  const route = await notificationRoute({
    bonds: async () => ({ data: [{ ...bond, id: 9, status: 'active' }, bond], meta: { total: 2, page: 1, per_page: 50 } }),
    messages: async (id, query) => {
      queries.push([id, query]);
      return { data: [{ id: id === 8 ? 40 : 41, bond_id: id, sender_user_id: 2, mine: false, body: 'Texto fictício', sent_at: '', read_at: null }], meta: { total: 1, page: 1, per_page: 1 } };
    },
  }, notification);
  assert.deepEqual(route, { pathname: '/chat', params: { bondId: 8 } });
  assert.deepEqual(queries, [[9, { after_id: 39, per_page: 1 }], [8, { after_id: 39, per_page: 1 }]]);
});

test('notificação sem mensagem acessível mostra erro, sem abrir outra conversa', async () => {
  await assert.rejects(notificationRoute({
    bonds: async () => ({ data: [], meta: { total: 0, page: 1, per_page: 50 } }),
    messages: async () => { throw new Error('não pode consultar sem vínculo'); },
  }, { id: 5, type: 'message.received', resource_id: 40, created_at: '', read_at: null }), (e: unknown) => e instanceof ApiError && e.status === 404);
});
