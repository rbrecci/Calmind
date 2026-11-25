import { Image, StyleSheet } from 'react-native';
import Animated, { css, useReducedMotion } from 'react-native-reanimated';

import { EaseInOut, EaseOut } from './motion';

// Fontes em SVG e o gerador dos PNG ficam em docs/prototipo/assets/ilustracoes/.
const sources = {
  conversa: require('../../assets/images/illustrations/conversa.png'),
  tarefas: require('../../assets/images/illustrations/tarefas.png'),
  agenda: require('../../assets/images/illustrations/agenda.png'),
  notificacoes: require('../../assets/images/illustrations/notificacoes.png'),
  relatos: require('../../assets/images/illustrations/relatos.png'),
  pacientes: require('../../assets/images/illustrations/pacientes.png'),
  'boas-vindas': require('../../assets/images/illustrations/boas-vindas.png'),
  aguardando: require('../../assets/images/illustrations/aguardando.png'),
} as const;

export type IllustrationName = keyof typeof sources;

const ENTRANCE_MS = 400;

const entrance = css.keyframes({
  from: { opacity: 0, transform: [{ translateY: 8 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
});
const fadeIn = css.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
const breathe = css.keyframes({
  from: { transform: [{ translateY: 0 }] },
  to: { transform: [{ translateY: -4 }] },
});

export type IllustrationProps = {
  name: IllustrationName;
  width?: number;
};

// Sempre decorativa: fica fora do leitor de tela, e o título ao lado diz o que importa.
// Entrada e respiro ficam em camadas separadas porque as duas mexem no translateY.
export function Illustration({ name, width = 240 }: IllustrationProps) {
  const reduced = useReducedMotion();
  return (
    <Animated.View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[styles.center, {
        animationName: reduced ? fadeIn : entrance,
        animationDuration: ENTRANCE_MS,
        animationTimingFunction: EaseOut,
        animationFillMode: 'backwards',
      }]}>
      <Animated.View style={reduced ? null : {
        animationName: breathe,
        animationDuration: 4000,
        animationDelay: ENTRANCE_MS,
        animationIterationCount: 'infinite',
        animationDirection: 'alternate',
        animationTimingFunction: EaseInOut,
      }}>
        <Image source={sources[name]} style={{ width, height: (width * 260) / 360 }} resizeMode="contain" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignSelf: 'center' },
});
