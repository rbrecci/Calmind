import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import { ButtonVariants, Colors, MinTouchTarget, Radius, RoleColors, Spacing } from './tokens';

export type ChipProps = {
  label: string;
  tone: 'patient' | 'psychologist';
  // Filtro ligado: cheio na cor do lado, com texto Dark. Sem a prop, o chip é ação e não estado.
  selected?: boolean;
  disabled?: boolean;
  // Sem `onPress` o chip é só rótulo (abordagem, modalidade no perfil), sem alvo de toque.
  onPress?: () => void;
  accessibilityLabel?: string;
};

// Pílula curta: filtro que liga e desliga, ou atributo do perfil. O contorno é Dark +1, porque as
// cores de lado reprovam como borda sobre o branco.
export function Chip({ label, tone, selected, disabled = false, onPress, accessibilityLabel }: ChipProps) {
  const colors = disabled
    ? { backgroundColor: Colors.background, borderColor: Colors.disabled }
    : selected
      ? { backgroundColor: RoleColors[tone].accent, borderColor: RoleColors[tone].accent }
      : { backgroundColor: ButtonVariants.secondary.background, borderColor: ButtonVariants.secondary.border };
  const text = <Text variant="small" style={{ color: disabled ? Colors.onDisabled : ButtonVariants.secondary.text }}>{label}</Text>;
  if (!onPress) return <View style={[styles.chip, colors]}>{text}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={selected === undefined ? { disabled } : { selected, disabled }} disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, styles.touchable, colors, pressed && !selected && { backgroundColor: RoleColors[tone].tint }]}>
      {text}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  touchable: { minHeight: MinTouchTarget }, // RNF-35
});
