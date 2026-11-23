import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bondStatusText, bondsWithConversation, selectBond } from './bonds.ts';
import type { PatientBond } from '../api/patient/types.ts';

const bond: PatientBond = { id: 1, status: 'ended', origin: 'catalog', requested_at: '', responded_at: null, accepted_at: null, ended_at: '', unread_messages: 0, psychologist: { id: 1, name: 'Profissional fictício', crp: '06/000001' } };

test('apresentação prioriza vínculo ativo, depois pendente, depois histórico', () => {
  const ended = { ...bond, id: 3 };
  const pending = { ...bond, id: 4, status: 'pending' as const };
  const active = { ...bond, id: 2, status: 'active' as const };
  assert.equal(selectBond([ended, pending, active])?.id, 2);
  assert.equal(selectBond([ended, pending])?.id, 4);
  assert.equal(selectBond([bond, ended])?.id, 3);
  assert.equal(selectBond([]), null);
});

// Só accepted_at diz se o vínculo ficou ativo. A recusa preenche responded_at; o cancelamento, nem isso.
const cancelled: PatientBond = { ...bond, id: 5, responded_at: null, accepted_at: null };
const rejected: PatientBond = { ...bond, id: 9, responded_at: '2026-10-29T08:00:00-03:00', accepted_at: null };
const endedAfterActive: PatientBond = { ...bond, id: 6, responded_at: '2026-10-29T08:00:00-03:00', accepted_at: '2026-10-29T08:00:00-03:00' };

test('solicitação cancelada ou recusada não aparece como vínculo encerrado', () => {
  assert.equal(bondStatusText(cancelled), 'Solicitação cancelada.');
  assert.equal(bondStatusText(rejected), 'Solicitação recusada.');
  assert.equal(bondStatusText(endedAfterActive), 'Vínculo encerrado. O histórico está disponível somente para leitura.');
  assert.equal(bondStatusText({ ...endedAfterActive, status: 'active', ended_at: null }), 'Seu acompanhamento está ativo.');
  assert.equal(bondStatusText({ ...bond, status: 'pending' }), 'Aguardando resposta do profissional');
});

test('só vínculo que chegou a ser aceito oferece conversa', () => {
  const active: PatientBond = { ...endedAfterActive, id: 7, status: 'active', ended_at: null };
  const pending: PatientBond = { ...bond, id: 8, status: 'pending', ended_at: null };
  assert.deepEqual(bondsWithConversation([active, pending, cancelled, rejected, endedAfterActive]).map((b) => b.id), [7, 6]);
});
