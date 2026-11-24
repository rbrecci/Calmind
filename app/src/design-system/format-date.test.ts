import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { formatDate, formatDateTime, formatTime } from './format-date.ts';

// As datas nascem de componentes locais, e o ISO é gerado a partir delas: assim o teste passa
// em qualquer fuso, porque a formatação também lê a hora local do aparelho.
function localIso(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): string {
  return new Date(year, month - 1, day, hour, minute, second).toISOString();
}

const NOW = new Date(2026, 10, 23, 10, 0);

describe('formatDateTime', () => {
  test('mostra dia da semana, dia, mês e hora, sem segundos', () => {
    assert.equal(formatDateTime(localIso(2026, 11, 25, 15, 0, 0), NOW), 'qua, 25/11 às 15:00');
    assert.equal(formatDateTime(localIso(2026, 11, 23, 21, 31, 2), NOW), 'seg, 23/11 às 21:31');
  });

  test('completa dia, mês, hora e minuto com zero', () => {
    assert.equal(formatDateTime(localIso(2026, 3, 5, 8, 7), NOW), 'qui, 05/03 às 08:07');
  });

  test('inclui o ano só quando ele é diferente do ano atual', () => {
    assert.equal(formatDateTime(localIso(2025, 12, 31, 23, 59), NOW), 'qua, 31/12/2025 às 23:59');
    assert.equal(formatDateTime(localIso(2027, 1, 4, 9, 0), NOW), 'seg, 04/01/2027 às 09:00');
  });

  test('usa a abreviação de cada dia da semana', () => {
    const week = [22, 23, 24, 25, 26, 27, 28].map((day) => formatDateTime(localIso(2026, 11, day, 12), NOW).split(',')[0]);
    assert.deepEqual(week, ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']);
  });

  // A API manda o horário com offset (-03:00). O mesmo instante tem de sair igual, venha ele
  // com offset ou em UTC: quem decide a hora mostrada é o fuso do aparelho, não o da string.
  test('trata o mesmo instante igual, com offset ou em UTC', () => {
    assert.equal(
      formatDateTime('2026-11-25T15:00:00-03:00', NOW),
      formatDateTime(new Date(Date.UTC(2026, 10, 25, 18, 0)).toISOString(), NOW),
    );
  });

  test('sem "agora" informado, compara com o ano corrente', () => {
    const thisYear = new Date().getFullYear();
    assert.doesNotMatch(formatDateTime(localIso(thisYear, 6, 15, 10)), /\/\d{4}/);
    assert.match(formatDateTime(localIso(thisYear - 1, 6, 15, 10)), new RegExp(`/${thisYear - 1} `));
  });
});

describe('formatDate', () => {
  test('mostra dia, mês e ano', () => {
    assert.equal(formatDate(localIso(2026, 11, 25, 15)), '25/11/2026');
    assert.equal(formatDate(localIso(2026, 3, 5)), '05/03/2026');
  });

  // "2026-11-25" lido como Date vira meia-noite UTC, que no Brasil ainda é dia 24. Data sem
  // hora (prazo de tarefa, dia da agenda) é dia de calendário e não pode andar com o fuso.
  test('data sem hora não muda de dia com o fuso', () => {
    assert.equal(formatDate('2026-11-25'), '25/11/2026');
    assert.equal(formatDate('2027-01-01'), '01/01/2027');
  });
});

describe('formatTime', () => {
  test('mostra hora e minuto, sem segundos', () => {
    assert.equal(formatTime(localIso(2026, 11, 25, 15, 0, 59)), '15:00');
    assert.equal(formatTime(localIso(2026, 11, 25, 0, 5)), '00:05');
  });
});
