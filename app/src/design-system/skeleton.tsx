import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { css, useReducedMotion } from 'react-native-reanimated';

import { EaseInOut } from './motion';
import { Colors, Radius, Spacing } from './tokens';

const pulse = css.keyframes({ from: { opacity: 1 }, to: { opacity: 0.45 } });

// O desenho imita o que vai chegar, para a tela não saltar quando os dados entram.
export type SkeletonVariant = 'list' | 'home' | 'calendar' | 'profile' | 'chat' | 'detail';

function Bone({ height, width = '100%', radius = Radius.control }: { height: number; width?: DimensionValue; radius?: number }) {
  return <View style={{ height, width, borderRadius: radius, backgroundColor: Colors.surface }} />;
}

function CardBone({ avatar = false }: { avatar?: boolean }) {
  return <View style={styles.card}>
    {avatar ? <Bone height={40} width={40} radius={20} /> : null}
    <View style={styles.lines}>
      <Bone height={16} width="60%" />
      <Bone height={12} width="85%" />
    </View>
  </View>;
}

const shapes: Record<SkeletonVariant, () => React.ReactNode> = {
  list: () => <>{[0, 1, 2, 3, 4].map((i) => <CardBone key={i} avatar />)}</>,
  home: () => <>
    <Bone height={20} width="40%" />
    <Bone height={150} radius={Radius.md} />
    <Bone height={20} width="40%" />
    <View style={styles.row}>{[0, 1, 2].map((i) => <View key={i} style={styles.flex}><Bone height={72} radius={Radius.md} /></View>)}</View>
    <CardBone />
  </>,
  calendar: () => <>
    <Bone height={150} radius={Radius.md} />
    <Bone height={360} radius={Radius.md} />
    <CardBone />
    <CardBone />
  </>,
  profile: () => <>
    <Bone height={140} radius={Radius.md} />
    <View style={styles.row}>
      <Bone height={80} width={80} radius={40} />
      <View style={styles.lines}><Bone height={18} width="70%" /><Bone height={12} width="40%" /></View>
    </View>
    <CardBone />
    <CardBone />
  </>,
  chat: () => <>{[0, 1, 2, 3, 4, 5].map((i) => <View key={i} style={{ alignItems: i % 2 ? 'flex-end' : 'flex-start' }}>
    <Bone height={48} width="65%" radius={Radius.md} />
  </View>)}</>,
  detail: () => <>
    <Bone height={24} width="50%" />
    <Bone height={14} />
    <Bone height={14} />
    <Bone height={14} width="70%" />
    <CardBone />
    <CardBone />
  </>,
};

export function Skeleton({ variant = 'list' }: { variant?: SkeletonVariant }) {
  const reduced = useReducedMotion();
  return (
    <Animated.View accessible accessibilityLabel="Carregando" accessibilityLiveRegion="polite" style={[styles.root, reduced ? null : {
      animationName: pulse,
      animationDuration: 900,
      animationIterationCount: 'infinite',
      animationDirection: 'alternate',
      animationTimingFunction: EaseInOut,
    }]}>
      {shapes[variant]()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch', gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md },
  lines: { flex: 1, gap: Spacing.two },
});
