import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { test } from 'node:test';
import { ApiError } from '../api/types.ts';
import type { Message, PatientApi } from '../api/patient/types.ts';
import { deliverMessage, mergeMessages, watchConversation } from './conversation.ts';

const message: Message = { id: 1, bond_id: 8, sender_user_id: 2, mine: false, body: 'Olá', sent_at: '2026-10-29T08:00:00-03:00', read_at: null };

test('combina mensagens sem duplicar e mantém a ordem crescente', () => {
  const result = mergeMessages([{ ...message, id: 3 }, message], [{ ...message, read_at: '2026-10-29T09:00:00-03:00' }, { ...message, id: 2 }]);
  assert.deepEqual(result.map((m) => m.id), [1, 2, 3]);
  assert.ok(result[0].read_at);
});

test('falha de envio preserva o rascunho sem objeto entregue', async () => {
  const result = await deliverMessage({ sendMessage: async () => { throw new ApiError(0, 'Sem conexão'); } }, 8, 'Meu texto');
  assert.deepEqual(result, { status: 'failed', body: 'Meu texto', error: 'Sem conexão' });
  assert.deepEqual(await deliverMessage({ sendMessage: async () => message }, 8, 'Olá'), { status: 'sent', message });
});

test('polling usa after_id a cada 5 segundos, marca leitura e para ao sair de foco', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  const queries: unknown[] = [];
  let reads = 0;
  const batches: Message[][] = [];
  const api: Pick<PatientApi, 'messages' | 'readMessages'> = {
    messages: async (_id, query) => {
      queries.push(query);
      return { data: queries.length === 1 ? [message] : [{ ...message, id: 2 }], meta: { total: 1, page: 1, per_page: 50 } };
    },
    readMessages: async () => ({ read: ++reads }),
  };
  const watch = watchConversation(api, 8, (batch) => batches.push(batch), () => assert.fail('erro inesperado'));
  await setImmediate();
  assert.equal(reads, 1);
  t.mock.timers.tick(4999); await setImmediate();
  assert.equal(queries.length, 1);
  t.mock.timers.tick(1); await setImmediate();
  assert.equal(queries.length, 2);
  assert.deepEqual(queries[1], { page: 1, per_page: 50, after_id: 1 });
  assert.equal(reads, 2);
  watch.stop(); t.mock.timers.tick(10000); await setImmediate();
  assert.equal(queries.length, 2);
  assert.equal(batches.length, 2);
});

test('resultado atrasado após sair de foco não atualiza conversa nem marca leitura', async () => {
  let release: ((value: Awaited<ReturnType<PatientApi['messages']>>) => void) | undefined;
  let reads = 0;
  let updates = 0;
  const watch = watchConversation({
    messages: () => new Promise((resolve) => { release = resolve; }),
    readMessages: async () => ({ read: ++reads }),
  }, 8, () => { updates++; }, () => assert.fail('erro inesperado'));
  watch.stop();
  release!({ data: [message], meta: { total: 1, page: 1, per_page: 50 } });
  await setImmediate();
  assert.equal(reads, 0);
  assert.equal(updates, 0);
});

test('sair de foco também cancela a busca das próximas páginas do histórico', async () => {
  let release: ((value: Awaited<ReturnType<PatientApi['messages']>>) => void) | undefined;
  let requests = 0;
  const watch = watchConversation({
    messages: () => {
      requests++;
      if (requests > 1) return Promise.resolve({ data: [], meta: { total: 0, page: 2, per_page: 50 } });
      return new Promise((resolve) => { release = resolve; });
    },
    readMessages: async () => ({ read: 0 }),
  }, 8, () => assert.fail('atualização depois de sair'), () => assert.fail('erro inesperado'));
  watch.stop();
  release!({ data: [message], meta: { total: 2, page: 1, per_page: 50 } });
  await setImmediate();
  assert.equal(requests, 1);
});
