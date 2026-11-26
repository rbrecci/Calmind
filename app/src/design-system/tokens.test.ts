import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { ButtonVariants, Colors, ErrorBannerColors, FieldColors, NeutralGradient, Palette, RoleColors, ScreenGradients, StatusTagColors } from './tokens.ts';

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

// Cor com transparência (#RRGGBBAA) pintada sobre o branco, que é o que fica atrás do fundo da tela.
function overWhite(hex: string): string {
  const alpha = hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1;
  const channel = (start: number) => Math.round(parseInt(hex.slice(start, start + 2), 16) * alpha + 255 * (1 - alpha));
  return `#${[1, 3, 5].map((start) => channel(start).toString(16).padStart(2, '0')).join('')}`;
}

const MIN_TEXT_CONTRAST = 4.5; // RNF-35
// Borda que desenha o controle é componente de interface, não texto: o mínimo é 3:1 (WCAG 1.4.11).
const MIN_UI_CONTRAST = 3;

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

  // Campo de texto: o valor digitado e o placeholder ficam sobre o fundo cinza do campo.
  test('texto e placeholder passam sobre o fundo de campo', () => {
    assert.ok(contrast(Colors.text, Colors.surface) >= MIN_TEXT_CONTRAST);
    assert.ok(contrast(Colors.textSecondary, Colors.surface) >= MIN_TEXT_CONTRAST);
  });

  // O campo é branco com borda: o valor e o placeholder ficam sobre o branco, e a borda tem de
  // desenhar o campo contra o branco de dentro e contra todo ponto do fundo da tela, por fora.
  test('campo branco: texto e placeholder passam, e a borda aparece dentro e fora', () => {
    assert.equal(FieldColors.background, Colors.background);
    assert.ok(contrast(Colors.text, FieldColors.background) >= MIN_TEXT_CONTRAST);
    assert.ok(contrast(FieldColors.placeholder, FieldColors.background) >= MIN_TEXT_CONTRAST);
    assert.ok(contrast(FieldColors.border, FieldColors.background) >= MIN_UI_CONTRAST);
    for (const { colors } of Object.values(ScreenGradients)) {
      for (const color of colors) assert.ok(contrast(FieldColors.border, overWhite(color)) >= MIN_UI_CONTRAST, `borda reprova em ${color}`);
    }
  });

  // A borda cinza dos cartões (2,9:1) não desenharia o campo, que sem ela some no fundo branco.
  test('a borda cinza dos cartões não serve de borda de campo', () => {
    assert.notEqual(FieldColors.border, Colors.border);
    assert.ok(contrast(Colors.border, FieldColors.background) < MIN_UI_CONTRAST);
  });

  test('o aviso de erro em bloco tem texto Dark que passa sobre o fundo dele', () => {
    assert.equal(ErrorBannerColors.text, Palette.dark.base);
    assert.ok(contrast(ErrorBannerColors.text, ErrorBannerColors.background) >= MIN_TEXT_CONTRAST);
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

  test('o texto de cada variante de botão passa sobre o fundo dela', () => {
    for (const [variant, { background, text }] of Object.entries(ButtonVariants)) {
      assert.ok(contrast(text, background) >= MIN_TEXT_CONTRAST, `${variant} reprova`);
    }
  });

  // O botão de contorno fica sobre o fundo da tela: é contra ele que a borda precisa aparecer.
  test('a borda de cada variante de botão aparece sobre o fundo da tela', () => {
    for (const [variant, { border }] of Object.entries(ButtonVariants)) {
      assert.ok(contrast(border, Colors.background) >= MIN_UI_CONTRAST, `${variant} reprova`);
    }
  });

  // Sem este teste, a borda cinza de `Colors.border` parece a escolha óbvia para o secundário,
  // e ela some no branco (2,9:1).
  test('a borda cinza dos campos não serve de contorno de botão', () => {
    assert.ok(contrast(Colors.border, Colors.background) < MIN_UI_CONTRAST);
  });

  test('o destrutivo não usa o vermelho base como texto, que reprova no branco', () => {
    assert.notEqual(ButtonVariants.destructive.text, Palette.danger.base);
  });

  // Exceção decidida pelo dono do projeto em 25/11, sabendo que reprova o AA: o botão principal
  // neutro (login, cadastro, consentimento) é contorno e texto em degradê sobre o branco, como
  // "Entrar" no protótipo. O texto usa os tons -1, os mais escuros das duas famílias; mesmo assim
  // o verde -1 fica em 2,9:1 e a borda nas bases não chega a 3:1. As medições continuam aqui
  // para a exceção não passar por acidente para outro botão nem piorar sem ninguém ver.
  test('exceção: o texto do botão neutro usa os tons -1, e o verde reprova o AA no branco', () => {
    assert.deepEqual(NeutralGradient.textColors, [Palette.secondary.shade, Palette.primary.shade]);
    assert.deepEqual(NeutralGradient.colors, [Palette.secondary.base, Palette.primary.base]);
    assert.ok(contrast(Palette.secondary.shade, Colors.background) < MIN_TEXT_CONTRAST);
    for (const color of NeutralGradient.colors) {
      assert.ok(contrast(color, Colors.background) < MIN_UI_CONTRAST, `${color} passou a valer como borda`);
    }
  });

  // Na web não há máscara para o degradê: o texto fica sólido, e aí não há motivo para reprovar.
  test('o texto do botão neutro na web passa sobre o branco', () => {
    assert.ok(contrast(NeutralGradient.textFallback, Colors.background) >= MIN_TEXT_CONTRAST);
  });

  // O tom claro do lado é a pílula da aba ativa e o fundo do avatar, sempre com Dark por cima.
  test('o texto Dark passa sobre o tom claro de cada lado', () => {
    for (const [role, { tint, onAccent }] of Object.entries(RoleColors)) {
      assert.ok(contrast(onAccent, tint) >= MIN_TEXT_CONTRAST, `${role} reprova`);
    }
  });

  // O fundo da tela vai do branco a um tom claro com transparência. Texto, apoio e erro ficam
  // direto sobre ele, então têm de passar também no ponto mais colorido do degradê.
  test('texto, texto de apoio e erro passam em todo ponto do fundo das telas', () => {
    for (const [tone, { colors }] of Object.entries(ScreenGradients)) {
      for (const color of colors) {
        for (const text of [Colors.text, Colors.textSecondary, Colors.error]) {
          assert.ok(contrast(text, overWhite(color)) >= MIN_TEXT_CONTRAST, `${text} reprova em ${tone} (${color})`);
        }
      }
    }
    assert.deepEqual(Object.keys(ScreenGradients).sort(), ['neutral', 'patient', 'psychologist']);
  });

  // Etiqueta de status: o texto é Dark sobre o tom claro de cada família, e tem de passar em todas.
  test('o texto de cada etiqueta de status passa sobre o fundo dela', () => {
    for (const [kind, { background, text }] of Object.entries(StatusTagColors)) {
      assert.equal(text, Palette.dark.base, `${kind} não usa texto Dark`);
      assert.ok(contrast(text, background) >= MIN_TEXT_CONTRAST, `${kind} reprova`);
    }
    assert.deepEqual(Object.keys(StatusTagColors).sort(), ['attention', 'negative', 'neutral', 'positive']);
  });

  // A regra 5.4: nesta paleta, branco sobre cor reprova. Se alguém trocar o texto para
  // branco num botão, este teste lembra por quê.
  test('branco sobre as cores de lado reprova, e por isso o texto é Dark', () => {
    for (const { accent } of Object.values(RoleColors)) {
      assert.ok(contrast('#FFFFFF', accent) < MIN_TEXT_CONTRAST);
    }
  });
});
