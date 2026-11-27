import { LinearGradient } from 'expo-linear-gradient';
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { BottomTabBarHeightContext } from 'expo-router/build/react-navigation/bottom-tabs';
import Reanimated, { useReducedMotion } from 'react-native-reanimated';

import { nextHeaderState, shouldCompleteHeaderScroll } from './header-transition';
import { Colors, MaxContentWidth, Radius, ScreenGradients, Spacing } from './tokens';
import { EaseOut, useScreenContentOpacity } from './motion';

type Props = {
  expandedHeader: ReactNode;
  compactHeader: ReactNode;
  children: ReactNode;
  onRefresh: () => Promise<void>;
  tone?: 'patient' | 'psychologist';
  loading?: boolean;
};

// O topo rola inteiro por trás da barra transparente nos cantos.
// O conteúdo branco reserva a altura revelada para manter os cartões abaixo dela.
export function ScrollingHeaderScreen({ expandedHeader, compactHeader, children, onRefresh, tone = 'patient', loading = false }: Props) {
  const [expandedHeight, setExpandedHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(80);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [compact, setCompact] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragging = useRef(false);
  const lastOffset = useRef(0);
  const scrollingDown = useRef(false);
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const reduced = useReducedMotion();
  const contentOpacity = useScreenContentOpacity();

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  const scheduleCompletion = (offset: number) => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    if (dragging.current || !scrollingDown.current || !shouldCompleteHeaderScroll(offset, expandedHeight)) return;
    settleTimer.current = setTimeout(() => {
      if (!dragging.current && shouldCompleteHeaderScroll(lastOffset.current, expandedHeight)) {
        scrollRef.current?.scrollTo({ y: expandedHeight, animated: !reduced });
      }
    }, 160);
  };

  const refresh = () => {
    setRefreshing(true);
    void onRefresh().finally(() => setRefreshing(false));
  };

  return <View style={styles.root} onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}>
    <LinearGradient colors={ScreenGradients[tone].colors} locations={ScreenGradients[tone].locations} style={StyleSheet.absoluteFill} />
    <Animated.View style={[styles.scroll, { opacity: contentOpacity }]}><ScrollView ref={scrollRef} style={styles.scroll} showsVerticalScrollIndicator={false} scrollEventThrottle={16}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      onScrollBeginDrag={() => {
        dragging.current = true;
        if (settleTimer.current) clearTimeout(settleTimer.current);
      }}
      onScrollEndDrag={(event) => {
        dragging.current = false;
        scheduleCompletion(event.nativeEvent.contentOffset.y);
      }}
      onScroll={(event) => {
        const offset = event.nativeEvent.contentOffset.y;
        if (offset !== lastOffset.current) scrollingDown.current = offset > lastOffset.current;
        lastOffset.current = offset;
        scheduleCompletion(offset);
        setCompact((current) => nextHeaderState(offset, expandedHeight, current));
      }}>
      <View>
        <View onLayout={(event) => setExpandedHeight(event.nativeEvent.layout.height)}>{expandedHeader}</View>
        <View style={[styles.surface, { minHeight: loading ? Math.max(0, viewportHeight - expandedHeight + Radius.lg) : viewportHeight + Radius.lg, paddingBottom: tabBarHeight + Spacing.four }]}>
          <LinearGradient colors={ScreenGradients[tone].colors} locations={ScreenGradients[tone].locations}
            style={[StyleSheet.absoluteFill, { top: -expandedHeight + Radius.lg }]} />
          {/* Compensa a sobreposição da curva quando o topo já saiu da tela. */}
          <View style={[styles.body, compact && { paddingTop: Spacing.page + headerHeight + Radius.lg }]}>{children}</View>
        </View>
      </View>
    </ScrollView></Animated.View>
    {/* A barra fica sempre montada e medida, só deslocada para fora da tela, e desce por
        translação. Animar a altura a partir de zero não funcionava na build de release. Vem depois
        da rolagem para desenhar por cima dela. */}
    <Reanimated.View style={[styles.header, {
      pointerEvents: compact ? 'auto' : 'none',
      opacity: compact ? 1 : 0,
      transform: [{ translateY: compact ? 0 : -headerHeight }],
      transitionProperty: ['transform', 'opacity'],
      transitionDuration: reduced ? 0 : 260,
      transitionTimingFunction: EaseOut,
    }]} accessibilityElementsHidden={!compact} importantForAccessibility={compact ? 'auto' : 'no-hide-descendants'}>
      <View onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>{compactHeader}</View>
    </Reanimated.View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1, backgroundColor: 'transparent' },
  content: { flexGrow: 1 },
  // A curva e o conteúdo compartilham um único degradê, sem uma tampa branca.
  surface: { marginTop: -Radius.lg, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.background },
  body: { flexGrow: 1, width: '100%', maxWidth: MaxContentWidth + Spacing.page * 2, alignSelf: 'center', padding: Spacing.page, gap: Spacing.three },
});
