import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Logo } from './logo';
import { Colors, HeaderGradients, Radius, RoleColors, Spacing } from './tokens';

export type HeroProps = {
  tone: 'patient' | 'psychologist';
  children: ReactNode;
  onHeightChange?: (height: number) => void;
  fullBleed?: boolean;
};

// Bloco de destaque no topo do início, colado ao cabeçalho de base reta (`AppHeader flush`): a
// mesma cor continua para baixo, e a borda branca arredondada do fim devolve o fundo da tela. O
// logo grande, recortado à direita, é decorativo. Texto em Dark, que passa nos dois tons (5.4).
// Precisa ser o primeiro filho do `Screen`: as margens negativas desfazem o recuo dele.
export function Hero({ tone, children, onHeightChange, fullBleed = false }: HeroProps) {
  const colors = RoleColors[tone];
  return (
    <View style={[styles.hero, fullBleed && { marginHorizontal: 0, marginTop: 0 }]} onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height)}>
      <LinearGradient colors={HeaderGradients[tone]}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      <View style={styles.logo}>
        <Logo size={248} tint={colors.shade} />
      </View>
      <View style={styles.content}>{children}</View>
      {!fullBleed && <View style={styles.cap} />}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 264,
    marginHorizontal: -Spacing.page,
    marginTop: -Spacing.page,
    overflow: 'hidden',
    paddingTop: Spacing.four + Spacing.three,
    paddingHorizontal: Spacing.page,
    paddingBottom: Spacing.five + Radius.lg,
  },
  logo: {
    position: 'absolute',
    right: -128,
    bottom: -72,
    opacity: 0.4,
    transform: [{ scaleX: -1 }],
    pointerEvents: 'none',
  },
  content: { gap: Spacing.five },
  cap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: Radius.lg,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    backgroundColor: Colors.background,
  },
});
