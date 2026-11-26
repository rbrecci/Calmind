import { useContext } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BottomTabBarHeightCallbackContext, type BottomTabBarProps } from 'expo-router/js-tabs';
import { CommonActions } from 'expo-router/react-navigation';

import { Text } from './text';
import { Colors, MinTouchTarget, Palette, Radius, RoleColors, Spacing } from './tokens';
import { FontFamily } from './typography';

export type TabBarProps = BottomTabBarProps & { tone: 'patient' | 'psychologist' };

// Barra de abas flutuante: cartão branco solto das bordas, ícone de contorno e rótulo embaixo.
// A aba ativa ganha a pílula no tom claro do lado atrás do ícone, e o ícone no tom escuro do
// lado (a base some sobre a pílula). O rótulo ativo continua Dark, no peso dos títulos: verde e
// rosa reprovam como texto no branco (RNF-35), e o rótulo fica no degrau small, o piso de 14.
// Entra no `tabBar` do layout de abas; o contador e o nome lido vêm das opções de cada aba.
export function TabBar({ tone, state, descriptors, navigation, insets }: TabBarProps) {
  // A altura medida vai para o BottomTabBarHeightContext, e é com ela que o `Screen` deixa o fim
  // do conteúdo acima da barra: ela flutua por cima da tela, não ao lado.
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  const colors = RoleColors[tone];
  return (
    <View
      pointerEvents="box-none"
      style={[styles.root, { paddingBottom: insets.bottom + Spacing.three }]}
      onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height)}>
      <View style={styles.card} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          // `tabBarLabel` separa o rótulo do título: a tela pode trocar o título do cabeçalho
          // (a conversa mostra o nome da profissional) sem mudar o nome da aba.
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.dispatch({ ...CommonActions.navigate(route), target: state.key });
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.item}>
              <View style={[styles.pill, focused && { backgroundColor: colors.tint }]}>
                {options.tabBarIcon?.({ focused, color: focused ? colors.shade : Colors.textSecondary, size: 24 })}
                {/* Contador na cor do lado com texto Dark: o vermelho com branco padrão reprova. */}
                {options.tabBarBadge !== undefined ? (
                  <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                    <Text variant="small" style={styles.badgeText}>{options.tabBarBadge}</Text>
                  </View>
                ) : null}
              </View>
              <Text variant="small" numberOfLines={1}
                style={{ color: focused ? Colors.text : Colors.textSecondary, fontFamily: focused ? FontFamily.heading : FontFamily.body }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.four,
  },
  card: {
    flexDirection: 'row',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderWidth: 1,
    // Borda de contorno do cartão, não de controle: o cinza claro basta, como no protótipo.
    borderColor: Palette.light.base,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  item: {
    flex: 1,
    minHeight: MinTouchTarget, // RNF-35
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
  },
  pill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.md,
  },
  badge: {
    position: 'absolute',
    top: -Spacing.one,
    right: 0,
    minWidth: 20,
    height: 20,
    paddingHorizontal: Spacing.one,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    lineHeight: 18,
  },
});
