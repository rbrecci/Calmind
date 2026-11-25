import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reportStatus, unpublishWarning } from './reports.ts';

test('confirmação de despublicação avisa sobre análise anterior quando informada pela API', () => {
  assert.match(unpublishWarning(true), /análise anterior/);
  assert.doesNotMatch(unpublishWarning(false), /análise anterior/);
});

test('status do relato: retirado vence a visibilidade, senão vale a visibilidade', () => {
  assert.equal(reportStatus({ visibility: 'private', unpublished_at: null }), 'private');
  assert.equal(reportStatus({ visibility: 'shared', unpublished_at: null }), 'shared');
  assert.equal(reportStatus({ visibility: 'shared', unpublished_at: '2026-11-20T10:00:00-03:00' }), 'unpublished');
});
