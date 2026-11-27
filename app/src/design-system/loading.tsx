import { StyleSheet, View } from 'react-native';
import Animated, { css, useReducedMotion } from 'react-native-reanimated';

import { Logo } from './logo';
import { EaseInOut } from './motion';
import { Text } from './text';
import { Spacing } from './tokens';

const pulse = css.keyframes({ from: { opacity: 1 }, to: { opacity: 0.4 } });

// Carregando de tela inteira, quando ainda não há nada para mostrar. Dentro de seção pequena
// o carregando continua texto, para não empurrar o resto da tela com um logo.
export function Loading() {
  const reduced = useReducedMotion();
  return (
    <View accessible accessibilityLabel="Carregando" accessibilityLiveRegion="polite" style={styles.container}>
      <Animated.View style={reduced ? null : {
        animationName: pulse,
        animationDuration: 1200,
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
        animationTimingFunction: EaseInOut,
      }}>
        <Logo size={56} />
      </Animated.View>
      <Text variant="small" color="textSecondary">Carregando</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.six },
});
