import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from './icon';
import { Text } from './text';
import { Colors, MinTouchTarget, Radius, RoleColors, Spacing } from './tokens';

export type ShortcutProps = {
  tone: 'patient' | 'psychologist';
  icon: IconName;
  label: string;
  // Contador ao lado do rótulo, como as tarefas pendentes. Zero não aparece (R2).
  badge?: number;
  onPress: () => void;
  accessibilityLabel?: string;
};

// Atalho do início: ícone de contorno no tom escuro do lado (a base some no branco) e rótulo em
// Dark, nunca na cor do lado, que reprova como texto.
export function Shortcut({ tone, icon, label, badge, onPress, accessibilityLabel }: ShortcutProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && { backgroundColor: Colors.surface }]}>
      <Icon name={icon} color={RoleColors[tone].shade} size={36} />
      <View style={styles.label}>
        <Text>{label}</Text>
        {badge ? <View style={[styles.badge, { backgroundColor: RoleColors[tone].accent }]}>
          <Text variant="small" style={{ color: RoleColors[tone].onAccent }}>{badge}</Text>
        </View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: MinTouchTarget, // RNF-35
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
  },
  label: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: { minWidth: 24, paddingHorizontal: Spacing.two, borderRadius: Radius.md, alignItems: 'center' },
});
