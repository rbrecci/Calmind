import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { Colors } from './tokens';

// Ícone de contorno: SF Symbols no iOS e Material Symbols no Android e na web, que o
// expo-symbols desenha com a fonte. O nome da web é o mesmo do Android.
export type IconName = { ios: SFSymbol; android: AndroidSymbol };

export type IconProps = {
  name: IconName;
  color?: ColorValue;
  size?: number;
};

// Sempre decorativo: quem diz o que o ícone faz é o rótulo do botão ou o texto ao lado.
export function Icon({ name, color = Colors.text, size = 24 }: IconProps) {
  return (
    <SymbolView
      name={{ ios: name.ios, android: name.android, web: name.android }}
      tintColor={color}
      size={size}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
