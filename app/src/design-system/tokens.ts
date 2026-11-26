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

// Cor de cada lado do app. Primária e secundária entram em botão, linha, cabeçalho e detalhe,
// nunca em grandes áreas de fundo (5.5). O texto sobre a cor é sempre Dark: branco reprova (5.4).
// `tint` é o tom claro (pílula da aba ativa, fundo do avatar, ponto mais claro do cabeçalho) e
// `shade` o escuro, que desenha o ícone da aba ativa sobre a pílula, onde a base sumiria.
export const RoleColors = {
  patient: { accent: Palette.secondary.base, onAccent: Palette.dark.base, tint: Palette.secondary.tint, shade: Palette.secondary.shade },
  psychologist: { accent: Palette.primary.base, onAccent: Palette.dark.base, tint: Palette.primary.tint, shade: Palette.primary.shade },
} as const;

// Botões que não são a ação principal. Os dois são contorno sobre o fundo da tela, para não
// competir com o botão cheio. O texto do destrutivo é o `-1` do Danger: a base reprova no
// branco (3,0:1). A borda do secundário é Dark +1 porque a cinza dos campos some no branco.
export const ButtonVariants = {
  secondary: { background: WHITE, border: Palette.dark.tint, text: Palette.dark.base },
  destructive: { background: WHITE, border: Palette.danger.shade, text: Palette.danger.shade },
} as const;

// Campo de texto: branco com borda fina, como no protótipo de 25/11. A borda é Dark +1 porque a
// cinza de `Colors.border` fica em 2,9:1 no branco e não desenha o campo (borda pede 3:1).
// Placeholder e erro passam no branco; mesmo assim o erro continua abaixo do campo.
export const FieldColors = {
  background: WHITE,
  border: Palette.dark.tint,
  placeholder: Palette.dark.tint,
} as const;

// Aviso de erro em bloco (`ErrorBanner`), como a falha do login: fundo no tom claro do Danger,
// texto Dark, borda no `-1`.
export const ErrorBannerColors = {
  background: Palette.danger.tint,
  border: Palette.danger.shade,
  text: Palette.dark.base,
} as const;

// Etiqueta de status: fundo no tom claro (`+1`) e texto Dark, que passa em todos (5.4). A
// paleta não tem amarelo, então "atenção" usa o lilás; o verde e o rosa base ficam com os lados.
export const StatusTagColors = {
  neutral: { background: Palette.light.tint, text: Palette.dark.base },
  attention: { background: Palette.primary.tint, text: Palette.dark.base },
  positive: { background: Palette.success.tint, text: Palette.dark.base },
  negative: { background: Palette.danger.tint, text: Palette.dark.base },
} as const;

// Telas anteriores ao login não escolhem lado e usam o Gradiente Verde-Rosa (5.3). O botão
// principal delas é contorno em degradê das bases e texto em degradê dos -1, sobre branco, como
// "Entrar" no protótipo de 25/11. Exceção ao AA decidida pelo dono do projeto: o verde -1 fica
// em 2,9:1 no branco (tokens.test.ts mede). Na web não há máscara para o degradê, e o texto
// fica sólido no rosa -1, que passa.
export const NeutralGradient = {
  colors: [Palette.secondary.base, Palette.primary.base],
  textColors: [Palette.secondary.shade, Palette.primary.shade],
  textFallback: Palette.primary.shade,
} as const;

// Fundo das telas: degradê vertical muito suave do branco a um tom claro com transparência
// (#RRGGBBAA). As telas neutras vão do verde no topo ao rosa no fim. A transparência é o teto
// em que texto de apoio e erro ainda passam 4,5:1 no ponto mais colorido (tokens.test.ts).
export const ScreenGradients = {
  neutral: { colors: [`${Palette.secondary.tint}99`, WHITE, WHITE, `${Palette.primary.tint}66`], locations: [0, 0.35, 0.65, 1] },
  patient: { colors: [WHITE, `${Palette.secondary.tint}99`], locations: [0.25, 1] },
  psychologist: { colors: [WHITE, `${Palette.primary.tint}66`], locations: [0.25, 1] },
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

// `lg` é a base arredondada do cabeçalho.
export const Radius = { md: 16, lg: 24 } as const;

// Largura máxima do conteúdo: em tablet ou na web o formulário não se estica pela tela toda.
export const MaxContentWidth = 480;
