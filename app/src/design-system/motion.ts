import { cubicBezier, Easing } from 'react-native-reanimated';

// Curvas de movimento do app. Cada uma existe em dois formatos porque o Reanimated 4.5 pede
// `cubicBezier` nos estilos CSS (rejeita o texto 'cubic-bezier(...)') e `Easing.bezier` nas
// animações de entrada e de layout.

// Ease-out: começa rápido e assenta devagar. É a curva de tudo que entra ou responde ao toque.
export const EaseOut = cubicBezier(0.23, 1, 0.32, 1);
export const EaseOutEasing = Easing.bezier(0.23, 1, 0.32, 1);

// Ease-in-out: ida e volta sem tranco, para o que fica em loop (respiro, pulso do carregando).
export const EaseInOut = cubicBezier(0.77, 0, 0.175, 1);
