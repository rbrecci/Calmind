// Fonte de verdade: docs/identidade-visual.md, seção 5. Onde este arquivo e o documento
// divergirem, o documento vence. Cor em tela vem sempre daqui, nunca como hex solto (RNF-34).

// 6 famílias, 3 tons cada. `shade` é o `-1` (mais escuro), `tint` é o `+1` (mais claro).
export const Palette = {
  primary: { shade: '#A858A9', base: '#F07EF2', tint: '#DFB3F2' }, // lado do psicólogo
  secondary: { shade: '#5BA958', base: '#82F27E', tint: '#D6F2C2' }, // lado do paciente
  light: { shade: '#989898', base: '#D9D9D9', tint: '#E4E4E4' },
  dark: { shade: '#141414', base: '#1C1C1C', tint: '#606060' },
  danger: { shade: '#B24040', base: '#FF5C5C', tint: '#FF8D8D' },
  success: { shade: '#5FA2B2', base: '#88E7FF', tint: '#ACEEFF' },
} as const;

const WHITE = '#FFFFFF';

// O app só tem tema claro: a identidade pede fundo majoritariamente branco e não define
// paleta escura. Se algum dia houver modo escuro, ele nasce aqui.
export const Colors = {
  background: WHITE,
  surface: Palette.light.tint, // fundo de campo
  border: Palette.light.shade,
  // "Dark" na identidade é o tom base: é com ele que a tabela de contraste (5.4) foi medida.
  text: Palette.dark.base,
  // Placeholder e texto de apoio. Dark +1 passa a 6,3:1 sobre branco (identidade, pendência 2).
  textSecondary: Palette.dark.tint,
  // Texto de erro sobre branco. A base do Danger reprova nesse uso (3,0:1), o `-1` passa.
  // Sobre `surface` ele dá 4,46:1 e reprova: a mensagem fica abaixo do campo, nunca dentro dele.
  error: Palette.danger.shade,
  success: Palette.success.shade,
  // Estado desabilitado usa a família Light (identidade, 5.2). Controle desabilitado é isento
  // do contraste mínimo, por isso aqui o texto é só mais apagado, não medido contra 4,5:1.
  disabled: Palette.light.base,
  onDisabled: Palette.dark.tint,
} as const;

// Cor de cada lado do app. Primária e secundária entram em botão, linha e detalhe, nunca em
// grandes áreas de fundo (5.5). O texto sobre a cor é sempre Dark: branco reprova (5.4).
export const RoleColors = {
  patient: { accent: Palette.secondary.base, onAccent: Palette.dark.base },
  psychologist: { accent: Palette.primary.base, onAccent: Palette.dark.base },
} as const;

// Telas anteriores ao login não escolhem lado e usam o Gradiente Verde-Rosa (5.3). Os dois
// extremos são as bases das duas famílias, como na medição de contraste da identidade.
export const NeutralGradient = {
  colors: [Palette.secondary.base, Palette.primary.base],
  onGradient: Palette.dark.base,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MinTouchTarget = 44; // RNF-35

export const Radius = { md: 16 } as const;

// Largura máxima do conteúdo: em tablet ou na web o formulário não se estica pela tela toda.
export const MaxContentWidth = 480;
