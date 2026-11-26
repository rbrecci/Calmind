import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Logo } from './logo';
import { Colors, Radius, RoleColors, Spacing } from './tokens';

export type HeroProps = {
  tone: 'patient' | 'psychologist';
  children: ReactNode;
};

// Bloco de destaque no topo do início, colado ao cabeçalho de base reta (`AppHeader flush`): a
// mesma cor continua para baixo, e a borda branca arredondada do fim devolve o fundo da tela. O
// logo grande, recortado à direita, é decorativo. Texto em Dark, que passa nos dois tons (5.4).
// Precisa ser o primeiro filho do `Screen`: as margens negativas desfazem o recuo dele.
export function Hero({ tone, children }: HeroProps) {
  const colors = RoleColors[tone];
  return (
    <View style={styles.hero}>
      <LinearGradient colors={[colors.accent, colors.tint]} style={StyleSheet.absoluteFill} />
      <View style={styles.logo}>
        <Logo size={220} />
      </View>
      <View style={styles.content}>{children}</View>
      <View style={styles.cap} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: -Spacing.four,
    marginTop: -Spacing.four,
    overflow: 'hidden',
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four + Radius.lg,
  },
  logo: {
    position: 'absolute',
    right: -72,
    bottom: Radius.lg - Spacing.three,
    opacity: 0.35,
    pointerEvents: 'none',
  },
  content: { gap: Spacing.three },
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
