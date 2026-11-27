import { Image, StyleSheet, type ColorValue } from 'react-native';
import Animated, { css, useReducedMotion } from 'react-native-reanimated';

import { EaseOut } from './motion';

const source = require('../../assets/images/calmind-logo.png');

const entrance = css.keyframes({
  from: { opacity: 0, transform: [{ scale: 0.96 }] },
  to: { opacity: 1, transform: [{ scale: 1 }] },
});
const fadeIn = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

export type LogoProps = {
  size?: number;
  // Entra uma vez ao montar. Com "reduzir movimento" no aparelho, só esmaece, sem escala.
  animated?: boolean;
  tint?: ColorValue;
};

// Só o símbolo. É decorativo: o nome "Calmind" escrito ao lado é que o leitor de tela lê.
export function Logo({ size = 112, animated = false, tint }: LogoProps) {
  const reduced = useReducedMotion();
  const motion = animated ? {
    animationName: reduced ? fadeIn : entrance,
    animationDuration: 500,
    animationTimingFunction: EaseOut,
    animationFillMode: 'backwards',
  } as const : null;
  return (
    <Animated.View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size }, motion]}>
      <Image source={source} style={styles.image} tintColor={tint} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
});
