import assert from 'node:assert/strict';
import { test } from 'node:test';

import { statusTagKind } from './status-kind.ts';

test('consulta marcada é neutra, seja a primeira marcação ou um reagendamento', () => {
  assert.equal(statusTagKind('scheduled'), 'neutral');
  assert.equal(statusTagKind('rescheduled'), 'neutral');
});

test('tarefa pendente pede atenção', () => {
  assert.equal(statusTagKind('pending'), 'attention');
});

test('consulta realizada e tarefa concluída são positivas', () => {
  assert.equal(statusTagKind('done'), 'positive');
  assert.equal(statusTagKind('completed'), 'positive');
});

test('consulta cancelada é negativa', () => {
  assert.equal(statusTagKind('cancelled'), 'negative');
});

test('relato privado e compartilhamento retirado são neutros, compartilhado é positivo', () => {
  assert.equal(statusTagKind('private'), 'neutral');
  assert.equal(statusTagKind('unpublished'), 'neutral');
  assert.equal(statusTagKind('shared'), 'positive');
});

test('vínculo ativo é positivo e encerrado é neutro', () => {
  assert.equal(statusTagKind('active'), 'positive');
  assert.equal(statusTagKind('ended'), 'neutral');
});
