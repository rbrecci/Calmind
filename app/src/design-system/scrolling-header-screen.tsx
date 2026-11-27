import { LinearGradient } from 'expo-linear-gradient';
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { BottomTabBarHeightContext } from 'expo-router/build/react-navigation/bottom-tabs';
import { useReducedMotion } from 'react-native-reanimated';

import { nextHeaderState, shouldCompleteHeaderScroll } from './header-transition';
import { Colors, MaxContentWidth, Radius, ScreenGradients, Spacing } from './tokens';
import { useScreenContentOpacity } from './motion';

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
  const [reveal] = useState(() => new Animated.Value(0));
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

  useEffect(() => {
    const animation = Animated.timing(reveal, {
      toValue: compact ? 1 : 0, duration: reduced ? 0 : 260,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false, // A altura reserva espaço real para a barra.
    });
    animation.start();
    return () => animation.stop();
  }, [compact, reduced, reveal]);

  const refresh = () => {
    setRefreshing(true);
    void onRefresh().finally(() => setRefreshing(false));
  };

  return <View style={styles.root} onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}>
    <LinearGradient colors={ScreenGradients[tone].colors} locations={ScreenGradients[tone].locations} style={StyleSheet.absoluteFill} />
    <Animated.View style={[styles.header, { height: reveal.interpolate({ inputRange: [0, 1], outputRange: [0, headerHeight] }), pointerEvents: compact ? 'auto' : 'none' }]}
      accessibilityElementsHidden={!compact} importantForAccessibility={compact ? 'auto' : 'no-hide-descendants'}>
      <View onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>{compactHeader}</View>
    </Animated.View>
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
          <Animated.View style={[styles.body, { paddingTop: reveal.interpolate({
            // Compensa a sobreposição da curva quando o topo já saiu da tela.
            inputRange: [0, 1], outputRange: [Spacing.page, Spacing.page + headerHeight + Radius.lg],
          }) }]}>{children}</Animated.View>
        </View>
      </View>
    </ScrollView></Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1, overflow: 'hidden', backgroundColor: 'transparent' },
  content: { flexGrow: 1 },
  // A curva e o conteúdo compartilham um único degradê, sem uma tampa branca.
  surface: { marginTop: -Radius.lg, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, overflow: 'hidden', backgroundColor: Colors.background },
  body: { flexGrow: 1, width: '100%', maxWidth: MaxContentWidth + Spacing.page * 2, alignSelf: 'center', padding: Spacing.page, gap: Spacing.three },
});
