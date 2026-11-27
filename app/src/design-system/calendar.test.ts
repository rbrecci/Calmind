import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { dayKey, formatDayKey, groupByDay, monthCells, monthRange, parseDayKey } from './calendar.ts';

describe('calendário', () => {
  it('mantém a data sem hora e usa o dia local de data com hora', () => {
    assert.equal(dayKey('2026-11-01'), '2026-11-01');
    assert.equal(dayKey(new Date(2026, 10, 1, 23, 59)), '2026-11-01');
    assert.equal(dayKey(parseDayKey('2026-02-28')), '2026-02-28');
  });

  it('recorta o mês inteiro, com semanas completas', () => {
    assert.deepEqual(monthRange(new Date(2026, 1, 10)), { from: '2026-02-01', to: '2026-02-28' });
    const cells = monthCells(new Date(2026, 10, 1));
    assert.equal(cells.length % 7, 0);
    assert.equal(cells.filter(Boolean).length, 30);
    assert.equal(cells[0], '2026-11-01'); // novembro de 2026 começa num domingo
  });

  it('nomeia o dia em português', () => {
    assert.equal(formatDayKey('2026-11-27'), 'sexta, 27 de novembro');
  });

  it('agrupa por dia, do mais recente para o mais antigo', () => {
    const at = (day: number, hour: number) => ({ created_at: new Date(2026, 10, day, hour).toISOString(), hour });
    const groups = groupByDay([at(1, 8), at(2, 9), at(1, 20)]);
    assert.deepEqual(groups.map((g) => [g.key, g.items.map((i) => i.hour)]), [['2026-11-02', [9]], ['2026-11-01', [20, 8]]]);
  });
});
