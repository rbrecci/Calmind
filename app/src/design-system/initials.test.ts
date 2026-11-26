import assert from 'node:assert/strict';
import { test } from 'node:test';

import { initials } from './initials.ts';

test('nome completo vira a inicial do primeiro e do último nome', () => {
  assert.equal(initials('Ana Paula Ribeiro'), 'AR');
  assert.equal(initials('Paciente de Teste'), 'PT');
});

test('um nome só vira uma letra', () => {
  assert.equal(initials('Camila'), 'C');
});

test('espaço sobrando e minúscula não mudam o resultado', () => {
  assert.equal(initials('  beatriz   lima  '), 'BL');
});

test('letra acentuada fica inteira', () => {
  assert.equal(initials('Ícaro Évora'), 'ÍÉ');
});

test('nome vazio não tem iniciais', () => {
  assert.equal(initials(''), '');
  assert.equal(initials('   '), '');
});
