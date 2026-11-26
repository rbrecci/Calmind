import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { ApiError } from '../types.ts';
import { setAuthToken } from '../auth-token.ts';
import { createPatientMock } from './mock.ts';
import type { CatalogQuery } from './types.ts';

beforeEach(() => setAuthToken('mock-token-1'));

test('mensagens genéricas e limite de convite seguem ApiErrorRenderer', async () => {
  const api = createPatientMock({ scenario: 'sem-vinculo' });
  setAuthToken(null);
  await assert.rejects(api.bonds(), (e: unknown) => e instanceof ApiError && e.message === 'Não autenticado. Entre para continuar.');
  setAuthToken('mock-token-2');
  await assert.rejects(api.bonds(), (e: unknown) => e instanceof ApiError && e.message === 'Você não tem permissão para realizar esta ação.');
  setAuthToken('mock-token-1');
  for (let i = 0; i < 5; i++) {
    await assert.rejects(api.redeemInvitation('INVALIDO'), (e: unknown) => e instanceof ApiError && e.status === 422 && e.message === 'Os dados enviados são inválidos.');
  }
  await assert.rejects(api.redeemInvitation('ABCD2345'), (e: unknown) => e instanceof ApiError && e.status === 429 && e.message === 'Muitas tentativas. Tente novamente em instantes.');
});

test('dados do paciente de teste não aparecem para outra conta', async () => {
  const api = createPatientMock();
  await api.acceptConsent(1);
  const privateReport = await api.createReport({ body: 'Diário fictício', visibility: 'private' });
  setAuthToken('mock-token-4');
  assert.equal((await api.reports()).meta.total, 0);
  assert.equal((await api.currentConsent()).accepted, false);
  await assert.rejects(api.changeVisibility(privateReport.id, 'private'), (e: unknown) => e instanceof ApiError && e.status === 404);
  await assert.rejects(api.messages(8), (e: unknown) => e instanceof ApiError && e.status === 404);
});

test('sem sessão recebe 401 e outro papel recebe 403', async () => {
  const api = createPatientMock();
  setAuthToken(null);
  await assert.rejects(api.bonds(), (e: unknown) => e instanceof ApiError && e.status === 401);
  setAuthToken('mock-token-2');
  await assert.rejects(api.bonds(), (e: unknown) => e instanceof ApiError && e.status === 403);
});

test('os três cenários mantêm vínculos e dados coerentes', async () => {
  for (const [scenario, status] of [['com-vinculo', 'active'], ['sem-vinculo', null], ['vinculo-pendente', 'pending']] as const) {
    const api = createPatientMock({ scenario });
    const bonds = await api.bonds();
    assert.equal(bonds.data[0]?.status ?? null, status);
    assert.equal(bonds.meta.total, status ? 1 : 0);
    assert.equal((await api.tasks()).data.length > 0, status === 'active');
  }
});

test('aceite da versão vigente é idempotente e libera mensagens', async () => {
  const api = createPatientMock();
  const term = await api.currentConsent();
  assert.equal(term.accepted, false);
  await assert.rejects(api.sendMessage(8, 'Olá'), (e: unknown) => e instanceof ApiError && e.status === 403);
  const acceptance = await api.acceptConsent(term.id);
  assert.deepEqual(await api.acceptConsent(term.id), acceptance);
  assert.equal((await api.currentConsent()).accepted, true);
  assert.equal((await api.sendMessage(8, ' Olá ')).body, 'Olá');
  await assert.rejects(api.acceptConsent(999), (e: unknown) => e instanceof ApiError && e.status === 422 && !!e.errors?.consent_term_id);
});

test('leitura de mensagens só marca a outra parte e não repete contagem', async () => {
  const api = createPatientMock();
  assert.deepEqual(await api.readMessages(8), { read: 1 });
  assert.deepEqual(await api.readMessages(8), { read: 0 });
  const messages = (await api.messages(8)).data;
  assert.equal(messages.find((m) => m.mine)?.read_at, null);
  assert.ok(messages.find((m) => !m.mine)?.read_at);
  assert.equal((await api.bonds()).data[0].unread_messages, 0);
  assert.deepEqual((await api.messages(8, { after_id: messages.at(-1)!.id })).data, []);
});

test('encerrar vínculo preserva histórico e bloqueia escrita', async () => {
  const api = createPatientMock();
  await api.acceptConsent(1);
  const accepted = (await api.bonds()).data[0].accepted_at;
  assert.ok(accepted);
  assert.equal((await api.endBond(8)).accepted_at, accepted);
  assert.equal((await api.bonds()).data[0].status, 'ended');
  assert.ok((await api.messages(8)).data.length);
  await assert.rejects(api.sendMessage(8, 'Olá'), (e: unknown) => e instanceof ApiError && e.status === 409);
  await assert.rejects(api.completeTask(1), (e: unknown) => e instanceof ApiError && e.status === 409);
  await assert.rejects(api.messages(999), (e: unknown) => e instanceof ApiError && e.status === 404);
});

test('solicitação fica pendente e convite ativa o vínculo sem duplicar', async () => {
  const api = createPatientMock({ scenario: 'sem-vinculo' });
  const requested = await api.requestBond(1);
  assert.equal(requested.status, 'pending');
  assert.equal(requested.accepted_at, null);
  await assert.rejects(api.requestBond(1), (e: unknown) => e instanceof ApiError && e.status === 409);
  const invited = createPatientMock({ scenario: 'sem-vinculo' });
  await assert.rejects(invited.redeemInvitation('INVALIDO'), (e: unknown) => e instanceof ApiError && e.status === 422 && !!e.errors?.code);
  const redeemed = await invited.redeemInvitation('ABCD2345');
  assert.equal(redeemed.status, 'active');
  assert.ok(redeemed.accepted_at);
  assert.equal((await invited.bonds()).data[0].accepted_at, redeemed.accepted_at);
  await assert.rejects(invited.redeemInvitation('ABCD2345'), (e: unknown) => e instanceof ApiError && e.status === 422);
});

test('paciente cancela só a solicitação pendente e pode pedir de novo', async () => {
  const api = createPatientMock({ scenario: 'vinculo-pendente' });
  const cancelled = await api.cancelBondRequest(8);
  assert.equal(cancelled.status, 'ended');
  assert.equal(cancelled.responded_at, null);
  assert.equal(cancelled.accepted_at, null);
  assert.ok(cancelled.ended_at);
  await assert.rejects(api.cancelBondRequest(8), (e: unknown) => e instanceof ApiError && e.status === 409);
  await assert.rejects(api.cancelBondRequest(999), (e: unknown) => e instanceof ApiError && e.status === 404);
  assert.equal((await api.requestBond(2)).status, 'pending');
  const withBond = createPatientMock();
  await assert.rejects(withBond.cancelBondRequest(8), (e: unknown) => e instanceof ApiError && e.status === 409 && e.message === 'Esta solicitação não está mais pendente.');
});

test('relatos mantêm privacidade e despublicação idempotente conforme o backend', async () => {
  const api = createPatientMock();
  await assert.rejects(api.createReport({ body: 'Hoje' }), (e: unknown) => e instanceof ApiError && e.status === 403);
  await api.acceptConsent(1);
  const shared = await api.createReport({ body: 'Hoje' });
  assert.equal(shared.visibility, 'shared');
  const privateReport = await api.createReport({ body: 'Meu diário', visibility: 'private' });
  await assert.rejects(api.changeVisibility(privateReport.id, 'shared'), (e: unknown) => e instanceof ApiError && e.status === 422 && !!e.errors?.visibility);
  assert.equal((await api.changeVisibility(privateReport.id, 'private')).visibility, 'private');
  const unpublished = await api.unpublishReport(shared.id);
  assert.ok(unpublished.unpublished_at);
  assert.deepEqual(await api.unpublishReport(shared.id), unpublished);
  await assert.rejects(api.unpublishReport(privateReport.id), (e: unknown) => e instanceof ApiError && e.status === 409);
  await assert.rejects(api.createReport({ body: '' }), (e: unknown) => e instanceof ApiError && e.status === 422 && !!e.errors?.body);
});

test('conclusão de tarefa e leituras de notificação são idempotentes', async () => {
  const api = createPatientMock();
  const completed = await api.completeTask(1);
  assert.equal(completed.status, 'completed');
  assert.deepEqual(await api.completeTask(1), completed);
  const first = (await api.notifications({ unread: true })).data[0];
  const read = await api.readNotification(first.id);
  assert.deepEqual(await api.readNotification(first.id), read);
  assert.ok((await api.readAllNotifications()).read > 0);
  assert.deepEqual(await api.readAllNotifications(), { read: 0 });
  assert.equal((await api.notifications({ unread: true })).meta.total, 0);
});

test('paginação informa o total e não vaza mutações da tela para o mock', async () => {
  const api = createPatientMock();
  const list = await api.reports({ per_page: 1 });
  assert.equal(list.data.length, 1);
  assert.ok(list.meta.total > 1);
  list.data[0].body = 'alteração externa';
  assert.notEqual((await api.reports()).data[0].body, 'alteração externa');
  await assert.rejects(api.messages(8, { per_page: 101 }), (e: unknown) => e instanceof ApiError && e.status === 422);
});

// RF-09: o mock filtra como o BondService (contém, sem diferenciar caixa e acento; modalidade exata)
test('catálogo filtra por abordagem, especialidade, região e modalidade como a API', async () => {
  const api = createPatientMock({ scenario: 'sem-vinculo' });
  const names = async (filters: CatalogQuery) => (await api.catalogPsychologists(filters)).data.map((p) => p.name);
  assert.deepEqual(await names({ approach: 'psicanalise' }), ['Atticus Finch']);
  assert.deepEqual(await names({ specialty: 'ESTRESSE' }), ['Hermione Granger']);
  assert.deepEqual(await names({ region: 'sao paulo' }), ['Hermione Granger']);
  assert.deepEqual(await names({ modality: 'online' }), ['Hermione Granger']);
  assert.deepEqual(await names({ modality: 'ambos' }), ['Atticus Finch']);
  assert.deepEqual(await names({ approach: 'cognitivo', region: 'Campinas' }), []);
  assert.deepEqual(await names({ approach: '', region: '  ' }), ['Atticus Finch', 'Hermione Granger']);
});

test('catálogo sem resultado devolve lista vazia e modalidade desconhecida é recusada', async () => {
  const api = createPatientMock({ scenario: 'sem-vinculo' });
  const none: CatalogQuery = { approach: 'Gestalt' };
  assert.deepEqual(await api.catalogPsychologists(none), { data: [], meta: { total: 0, page: 1, per_page: 20 } });
  const invalid = { modality: 'hibrido' } as unknown as CatalogQuery;
  await assert.rejects(api.catalogPsychologists(invalid), (e: unknown) => e instanceof ApiError && e.status === 422 && !!e.errors?.modality);
});
