import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { groupMessagesByDay } from './message-days.ts';

function localIso(year: number, month: number, day: number, hour = 0, minute = 0): string {
  return new Date(year, month - 1, day, hour, minute).toISOString();
}

const NOW = new Date(2026, 10, 23, 10, 0);

describe('groupMessagesByDay', () => {
  test('sem mensagens, não há grupo', () => {
    assert.deepEqual(groupMessagesByDay([], NOW), []);
  });

  test('junta as mensagens seguidas do mesmo dia sob um título', () => {
    const messages = [
      { id: 1, sent_at: localIso(2026, 11, 16, 9) },
      { id: 2, sent_at: localIso(2026, 11, 16, 18, 30) },
      { id: 3, sent_at: localIso(2026, 11, 23, 8, 5) },
    ];
    const groups = groupMessagesByDay(messages, NOW);
    assert.deepEqual(groups.map((group) => group.label), ['Segunda, 16/11', 'Segunda, 23/11']);
    assert.deepEqual(groups.map((group) => group.messages.map((message) => message.id)), [[1, 2], [3]]);
  });

  // O dia é o do aparelho: 23:59 e 00:01 da noite seguinte são dias diferentes.
  test('a virada da meia-noite local abre outro dia', () => {
    const groups = groupMessagesByDay([
      { id: 1, sent_at: localIso(2026, 11, 20, 23, 59) },
      { id: 2, sent_at: localIso(2026, 11, 21, 0, 1) },
    ], NOW);
    assert.deepEqual(groups.map((group) => group.label), ['Sexta, 20/11', 'Sábado, 21/11']);
  });

  test('a chave de cada grupo é única e estável, para servir de key na lista', () => {
    const groups = groupMessagesByDay([
      { id: 1, sent_at: localIso(2025, 12, 31, 22) },
      { id: 2, sent_at: localIso(2026, 1, 1, 9) },
    ], NOW);
    assert.deepEqual(groups.map((group) => group.key), ['2025-12-31', '2026-01-01']);
    assert.equal(groups[0].label, 'Quarta, 31/12/2025');
  });

  test('mantém a ordem e os próprios objetos recebidos', () => {
    const messages = [{ id: 7, sent_at: localIso(2026, 11, 23, 9), body: 'oi' }];
    const [group] = groupMessagesByDay(messages, NOW);
    assert.equal(group.messages[0], messages[0]);
  });
});
