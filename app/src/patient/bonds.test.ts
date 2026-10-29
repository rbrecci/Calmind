import assert from 'node:assert/strict';
import { test } from 'node:test';
import { selectBond } from './bonds.ts';
import type { PatientBond } from '../api/patient/types.ts';

const bond: PatientBond = { id: 1, status: 'ended', origin: 'catalog', requested_at: '', responded_at: null, ended_at: '', unread_messages: 0, psychologist: { id: 1, name: 'Profissional fictício', crp: '06/000001' } };

test('apresentação prioriza vínculo ativo, depois pendente, depois histórico', () => {
  const ended = { ...bond, id: 3 };
  const pending = { ...bond, id: 4, status: 'pending' as const };
  const active = { ...bond, id: 2, status: 'active' as const };
  assert.equal(selectBond([ended, pending, active])?.id, 2);
  assert.equal(selectBond([ended, pending])?.id, 4);
  assert.equal(selectBond([bond, ended])?.id, 3);
  assert.equal(selectBond([]), null);
});
