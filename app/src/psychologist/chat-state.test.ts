import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createChatController } from './chat-state.ts';
import { ApiError } from '../api/types.ts';
import type { Message } from '../api/psychologist/types.ts';

const message = (id: number, mine = false): Message => ({
  id, bond_id: 8, sender_user_id: mine ? 2 : 21, mine,
  body: `Mensagem ${id}`, sent_at: '2026-10-29T08:15:00-03:00', read_at: null,
});
const page = (data: Message[]) => ({ data, meta: { total: data.length, page: 1, per_page: 100 } });
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

test('chat busca ao focar, usa after_id e encerra o polling ao sair', async () => {
  const calls: unknown[] = [];
  let poll: (() => void) | undefined;
  let cleared = 0;
  let reads = 0;
  const controller = createChatController({
    messages: async (_bond, query) => { calls.push(query); return page([message(calls.length)]); },
    readMessages: async () => { reads++; return { read: 1 }; },
    sendMessage: async () => message(10, true),
  }, 8, () => {}, {
    every: (callback, delay) => { assert.equal(delay, 5000); poll = callback; return 1; },
    clear: () => { cleared++; },
  });
  controller.start();
  await tick();
  assert.equal(reads, 1);
  poll?.();
  await tick();
  assert.deepEqual(calls, [{ after_id: 0, per_page: 100 }, { after_id: 1, per_page: 100 }]);
  assert.equal(reads, 2);
  assert.deepEqual(controller.snapshot().messages.map((item) => item.id), [1, 2]);
  controller.stop();
  assert.equal(cleared, 1);
});

test('resposta atrasada depois de sair nao publica estado nem marca leitura', async () => {
  let resolve!: (value: ReturnType<typeof page>) => void;
  let updates = 0;
  let reads = 0;
  const controller = createChatController({
    messages: () => new Promise((done) => { resolve = done; }),
    readMessages: async () => { reads++; return { read: 0 }; },
    sendMessage: async () => message(10, true),
  }, 8, () => { updates++; }, { every: () => 1, clear: () => {} });
  controller.start();
  controller.stop();
  const before = updates;
  resolve(page([message(1)]));
  await tick();
  assert.equal(updates, before);
  assert.equal(reads, 0);
  assert.deepEqual(controller.snapshot().messages, []);
});

test('falha de envio conserva rascunho como falho e reenviar so entrega a resposta real', async () => {
  let attempts = 0;
  const controller = createChatController({
    messages: async () => page([]),
    readMessages: async () => ({ read: 0 }),
    sendMessage: async (_bond, body) => {
      assert.equal(body, 'Bom dia');
      if (++attempts === 1) throw new ApiError(0, 'Sem conexão.');
      return { ...message(10, true), body };
    },
  }, 8, () => {}, { every: () => 1, clear: () => {} });
  controller.start();
  await tick();
  await controller.send('Bom dia');
  assert.deepEqual(controller.snapshot().messages, []);
  assert.equal(controller.snapshot().outbox[0].status, 'failed');
  assert.equal(controller.snapshot().outbox[0].error, 'Sem conexão.');
  await controller.retry(controller.snapshot().outbox[0].id);
  assert.deepEqual(controller.snapshot().outbox, []);
  assert.equal(controller.snapshot().messages[0].body, 'Bom dia');
  controller.stop();
});

test('duas tentativas simultaneas do mesmo rascunho nao duplicam o envio', async () => {
  let resolve!: (value: Message) => void;
  let attempts = 0;
  const controller = createChatController({
    messages: async () => page([]), readMessages: async () => ({ read: 0 }),
    sendMessage: async () => { attempts++; return new Promise((done) => { resolve = done; }); },
  }, 8, () => {}, { every: () => 1, clear: () => {} });
  controller.start();
  await tick();
  const sending = controller.send('Olá');
  await controller.retry(controller.snapshot().outbox[0].id);
  assert.equal(attempts, 1);
  resolve(message(5, true));
  await sending;
  controller.stop();
});

test('carrega paginas antigas ate a mensagem mais recente sem duplicar ids', async () => {
  let calls = 0;
  const controller = createChatController({
    messages: async (_bond, query) => {
      calls++;
      if (!query?.after_id) return { data: [message(1)], meta: { total: 2, page: 1, per_page: 1 } };
      return page([message(2)]);
    }, readMessages: async () => ({ read: 0 }), sendMessage: async () => message(10, true),
  }, 8, () => {}, { every: () => 1, clear: () => {} });
  controller.start();
  await tick();
  assert.equal(calls, 2);
  assert.deepEqual(controller.snapshot().messages.map((item) => item.id), [1, 2]);
  controller.stop();
});

test('voltar ao foco ignora o fetch da sessao de foco anterior', async () => {
  const resolvers: ((value: ReturnType<typeof page>) => void)[] = [];
  let reads = 0;
  const controller = createChatController({
    messages: () => new Promise((resolve) => { resolvers.push(resolve); }),
    readMessages: async () => { reads++; return { read: 0 }; },
    sendMessage: async () => message(10, true),
  }, 8, () => {}, { every: () => 1, clear: () => {} });
  controller.start();
  controller.stop();
  controller.start();
  resolvers[1](page([message(2)]));
  await tick();
  resolvers[0](page([message(1)]));
  await tick();
  assert.deepEqual(controller.snapshot().messages.map((item) => item.id), [2]);
  assert.equal(reads, 1);
  controller.stop();
});

test('envio com erro de campo mostra o texto de body devolvido pela API', async () => {
  const controller = createChatController({
    messages: async () => page([]), readMessages: async () => ({ read: 0 }),
    sendMessage: async () => { throw new ApiError(422, 'Dados inválidos.', { body: ['Mensagem longa demais.'] }); },
  }, 8, () => {}, { every: () => 1, clear: () => {} });
  controller.start();
  await tick();
  await controller.send('Mensagem');
  assert.equal(controller.snapshot().outbox[0].error, 'Mensagem longa demais.');
  controller.stop();
});

test('envio nao avanca cursor de recebimento nem pula mensagem anterior do paciente', async () => {
  const cursors: (number | undefined)[] = [];
  const controller = createChatController({
    messages: async (_bond, query) => {
      cursors.push(query?.after_id);
      if (cursors.length === 1) return page([message(40)]);
      return page([message(42), message(43, true)]);
    },
    readMessages: async () => ({ read: 0 }),
    sendMessage: async () => message(43, true),
  }, 8, () => {}, { every: () => 1, clear: () => {} });
  controller.start();
  await tick();
  await controller.send('Minha resposta');
  await controller.reload();
  assert.deepEqual(cursors, [0, 40]);
  assert.deepEqual(controller.snapshot().messages.map((item) => item.id), [40, 42, 43]);
  controller.stop();
});

test('erros tecnicos de envio e recebimento viram textos genericos', async () => {
  const controller = createChatController({
    messages: async () => { throw new TypeError('SELECT secret FROM clinical_messages'); },
    readMessages: async () => ({ read: 0 }),
    sendMessage: async () => { throw new Error('Cannot read properties of undefined'); },
  }, 8, () => {}, { every: () => 1, clear: () => {} });
  controller.start();
  await tick();
  const failure = controller.snapshot().error;
  assert.equal(failure instanceof Error ? failure.message : null, 'Não foi possível carregar as mensagens. Tente novamente.');
  await controller.send('Olá');
  assert.equal(controller.snapshot().outbox[0].error, 'Não foi possível enviar a mensagem. Tente novamente.');
  controller.stop();
});
