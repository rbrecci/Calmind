// Fonte de verdade: docs/identidade-visual.md, seção 6.
// Quicksand SemiBold nos títulos (carrega o tom de calma), Poppins Regular no corpo
// (a Quicksand cansa em texto corrido, por isso não desce para o corpo).

// Nomes que o expo-font registra. Têm de bater com as chaves de fonts.ts.
export const FontFamily = {
  heading: 'Quicksand_600SemiBold',
  body: 'Poppins_400Regular',
} as const;

// lineHeight não está na identidade: 1,2x nos títulos e 1,5x no texto corrido, que é o que
// mantém a leitura confortável sem apertar a Quicksand.
export const Typography = {
  h1: { fontFamily: FontFamily.heading, fontSize: 40, lineHeight: 48 },
  h2: { fontFamily: FontFamily.heading, fontSize: 34, lineHeight: 41 },
  h3: { fontFamily: FontFamily.heading, fontSize: 28, lineHeight: 34 },
  h4: { fontFamily: FontFamily.heading, fontSize: 24, lineHeight: 29 },
  h5: { fontFamily: FontFamily.heading, fontSize: 18, lineHeight: 22 },
  body: { fontFamily: FontFamily.body, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: FontFamily.body, fontSize: 14, lineHeight: 21 },
} as const;

export type TextVariant = keyof typeof Typography;

// RNF-34: o corpo de texto nunca desce abaixo de 14.
export const MIN_BODY_FONT_SIZE = 14;
