import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { Colors } from './tokens';
import { Typography, type TextVariant } from './typography';

export type TextColor = 'text' | 'textSecondary' | 'error' | 'success';

export type TextProps = NativeTextProps & {
  variant?: TextVariant;
  color?: TextColor;
};

// Todo texto do app passa por aqui: tamanho e fonte vêm da escala da identidade, a cor vem
// dos tokens. Quem quiser outra combinação cria um degrau na escala, não um estilo solto.
export function Text({ variant = 'body', color = 'text', style, ...rest }: TextProps) {
  const isHeading = variant.startsWith('h');

  return (
    <NativeText
      accessibilityRole={isHeading ? 'header' : undefined}
      style={[Typography[variant], { color: Colors[color] }, style]}
      {...rest}
    />
  );
}
