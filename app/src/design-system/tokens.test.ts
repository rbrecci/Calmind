import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { Colors, NeutralGradient, Palette, RoleColors } from './tokens.ts';

// Contraste WCAG 2.x entre duas cores em hex (#RRGGBB).
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

const MIN_TEXT_CONTRAST = 4.5; // RNF-35

describe('contraste da identidade visual', () => {
  // Garante que a fórmula daqui é a mesma da identidade (seção 5.4), antes de confiar nas outras.
  test('reproduz as medições publicadas em identidade-visual.md', () => {
    const measured = (a: string, b: string) => Number(contrast(a, b).toFixed(2));

    assert.equal(measured(Palette.primary.base, '#FFFFFF'), 2.34);
    assert.equal(measured(Palette.primary.base, Palette.dark.base), 7.28);
    assert.equal(measured(Palette.secondary.base, Palette.dark.base), 12.13);
    assert.equal(measured(Palette.danger.base, '#FFFFFF'), 3.03);
  });

  test('texto e placeholder passam sobre o fundo branco', () => {
    assert.ok(contrast(Colors.text, Colors.background) >= MIN_TEXT_CONTRAST);
    assert.ok(contrast(Colors.textSecondary, Colors.background) >= MIN_TEXT_CONTRAST);
  });

  test('texto de erro passa sobre o fundo branco', () => {
    assert.ok(contrast(Colors.error, Colors.background) >= MIN_TEXT_CONTRAST);
  });

  // Mesmo raciocínio do teste do branco: se alguém puser a mensagem de erro dentro do fundo
  // cinza do campo, ela reprova por pouco (4,46:1), e este teste explica o motivo.
  test('texto de erro sobre o fundo de campo reprova, por isso fica abaixo do campo', () => {
    assert.ok(contrast(Colors.error, Colors.surface) < MIN_TEXT_CONTRAST);
  });

  test('o texto de cada lado passa sobre a cor do lado', () => {
    for (const [role, { accent, onAccent }] of Object.entries(RoleColors)) {
      assert.ok(contrast(onAccent, accent) >= MIN_TEXT_CONTRAST, `${role} reprova`);
    }
  });

  test('o texto passa sobre os dois extremos do gradiente', () => {
    for (const color of NeutralGradient.colors) {
      assert.ok(contrast(NeutralGradient.onGradient, color) >= MIN_TEXT_CONTRAST, `${color} reprova`);
    }
  });

  // A regra 5.4: nesta paleta, branco sobre cor reprova. Se alguém trocar o texto para
  // branco num botão, este teste lembra por quê.
  test('branco sobre as cores de lado reprova, e por isso o texto é Dark', () => {
    for (const { accent } of Object.values(RoleColors)) {
      assert.ok(contrast('#FFFFFF', accent) < MIN_TEXT_CONTRAST);
    }
  });
});
