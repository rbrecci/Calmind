import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';
import Animated, { FadeIn, Keyframe, LayoutAnimationConfig, ReduceMotion, useReducedMotion } from 'react-native-reanimated';

import { EaseOutEasing } from './motion';

// Só opacidade, por isso fica ligado mesmo com "reduzir movimento": o que o ajuste tira é
// deslocamento, escala e loop, não o esmaecimento.
const fade = FadeIn.duration(220).easing(EaseOutEasing).reduceMotion(ReduceMotion.Never);
const riseFade = FadeIn.duration(200).easing(EaseOutEasing).reduceMotion(ReduceMotion.Never);
const rise = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 8 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: EaseOutEasing },
}).duration(200);

export type AppearProps = ViewProps & {
  // Sobe 8 pontos enquanto aparece, como a mensagem que chega na conversa.
  rise?: boolean;
};

// Caixa que esmaece ao montar. Anima só na montagem: a mesma lista recarregada com as mesmas
// keys não repete a entrada.
export function Appear({ rise: rising = false, ...rest }: AppearProps) {
  const reduced = useReducedMotion();
  return <Animated.View entering={!rising ? fade : reduced ? riseFade : rise} {...rest} />;
}

// O que já está dentro quando o grupo monta não anima; só o que chega depois. Na conversa, as
// mensagens que estavam lá ao abrir aparecem paradas, e só a nova entra.
export function SkipInitialAppear({ children }: { children: ReactNode }) {
  return <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>;
}
