import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { FontFamily, MIN_BODY_FONT_SIZE, Typography } from './typography.ts';

describe('escala tipográfica da identidade visual', () => {
  test('os títulos seguem os tamanhos da identidade', () => {
    assert.deepEqual(
      [Typography.h1, Typography.h2, Typography.h3, Typography.h4, Typography.h5].map((v) => v.fontSize),
      [40, 34, 28, 24, 18],
    );
  });

  test('parágrafo é 16 e small é 14', () => {
    assert.equal(Typography.body.fontSize, 16);
    assert.equal(Typography.small.fontSize, 14);
  });

  test('títulos usam Quicksand SemiBold e o corpo usa Poppins', () => {
    for (const variant of ['h1', 'h2', 'h3', 'h4', 'h5'] as const) {
      assert.equal(Typography[variant].fontFamily, FontFamily.heading, variant);
    }
    for (const variant of ['body', 'small'] as const) {
      assert.equal(Typography[variant].fontFamily, FontFamily.body, variant);
    }
    assert.equal(FontFamily.heading, 'Quicksand_600SemiBold');
  });

  // RNF-34: nenhum degrau da escala pode ficar abaixo do piso de leitura.
  test('nenhum degrau desce abaixo de 14', () => {
    for (const [name, variant] of Object.entries(Typography)) {
      assert.ok(variant.fontSize >= MIN_BODY_FONT_SIZE, `${name} tem ${variant.fontSize}`);
    }
  });

  test('a altura de linha nunca é menor que o tamanho da fonte', () => {
    for (const [name, variant] of Object.entries(Typography)) {
      assert.ok(variant.lineHeight >= variant.fontSize, name);
    }
  });
});
