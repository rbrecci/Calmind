import { cubicBezier, Easing, useReducedMotion } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Animated, Easing as NativeEasing } from 'react-native';

// Curvas de movimento do app. Cada uma existe em dois formatos porque o Reanimated 4.5 pede
// `cubicBezier` nos estilos CSS (rejeita o texto 'cubic-bezier(...)') e `Easing.bezier` nas
// animações de entrada e de layout.

// Ease-out: começa rápido e assenta devagar. É a curva de tudo que entra ou responde ao toque.
export const EaseOut = cubicBezier(0.23, 1, 0.32, 1);
export const EaseOutEasing = Easing.bezier(0.23, 1, 0.32, 1);

// Ease-in-out: ida e volta sem tranco, para o que fica em loop (respiro, pulso do carregando).
export const EaseInOut = cubicBezier(0.77, 0, 0.175, 1);

// Anima apenas o conteúdo quando a tela recebe foco, mantendo cabeçalhos independentes.
export function useScreenContentOpacity() {
  const [opacity] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();
  useFocusEffect(useCallback(() => {
    opacity.setValue(reduced ? 1 : 0);
    const animation = Animated.timing(opacity, { toValue: 1, duration: reduced ? 0 : 240,
      easing: NativeEasing.out(NativeEasing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [opacity, reduced]));
  return opacity;
}
