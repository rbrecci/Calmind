import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextHeaderState, shouldCompleteHeaderScroll } from './header-transition.ts';

test('a barra só aparece quando o topo saiu e não pisca na fronteira', () => {
  assert.equal(nextHeaderState(317, 320, false), false);
  assert.equal(nextHeaderState(319, 320, false), true);
  assert.equal(nextHeaderState(320, 320, false), true);
  assert.equal(nextHeaderState(319, 320, true), true);
  assert.equal(nextHeaderState(289, 320, true), true);
  assert.equal(nextHeaderState(288, 320, true), false);
});

test('completa a rolagem apenas depois da metade e antes do fim do destaque', () => {
  assert.equal(shouldCompleteHeaderScroll(159, 320), false);
  assert.equal(shouldCompleteHeaderScroll(160, 320), true);
  assert.equal(shouldCompleteHeaderScroll(317, 320), true);
  assert.equal(shouldCompleteHeaderScroll(319, 320), false);
  assert.equal(shouldCompleteHeaderScroll(320, 320), false);
  assert.equal(shouldCompleteHeaderScroll(0, 0), false);
});

test('retorno, arrasto negativo e primeira medição mantêm o topo expandido', () => {
  assert.equal(nextHeaderState(0, 320, true), false);
  assert.equal(nextHeaderState(-50, 320, false), false);
  assert.equal(nextHeaderState(100, 0, false), false);
  assert.equal(nextHeaderState(540, 500, false), true);
});
