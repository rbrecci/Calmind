import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { formatUnread, tabBadge } from './counts.ts';

describe('formatUnread', () => {
  test('concorda com o número: singular para 1, plural para mais', () => {
    assert.equal(formatUnread(1), '1 não lida');
    assert.equal(formatUnread(2), '2 não lidas');
    assert.equal(formatUnread(15), '15 não lidas');
  });

  test('zero vira texto, para o leitor de tela não anunciar "0 não lidas"', () => {
    assert.equal(formatUnread(0), 'nenhuma não lida');
  });
});

describe('tabBadge', () => {
  test('mostra a contagem quando há item não lido', () => {
    assert.equal(tabBadge(3, false), 3);
  });

  test('some com zero ou enquanto a contagem não chegou', () => {
    assert.equal(tabBadge(0, false), undefined);
    assert.equal(tabBadge(undefined, false), undefined);
  });

  test('some na aba aberta, onde a lista já está na frente da pessoa', () => {
    assert.equal(tabBadge(3, true), undefined);
  });
});
