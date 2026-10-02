import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from './text';
import { Colors, MinTouchTarget, NeutralGradient, Radius, RoleColors, Spacing } from './tokens';

// `neutral` é o botão das telas anteriores ao login, que não escolhem lado e usam o gradiente.
// `patient` e `psychologist` entram depois do login, cada um com a cor do seu lado.
export type ButtonTone = 'neutral' | 'patient' | 'psychologist';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  tone = 'neutral',
  disabled = false,
  accessibilityLabel,
  style,
}: ButtonProps) {
  // O texto sobre cor é sempre Dark: branco reprova o contraste em todas as cores (5.4).
  const textColor = tone === 'neutral' ? NeutralGradient.onGradient : RoleColors[tone].onAccent;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.pressable, style]}>
      {disabled ? (
        <View style={[styles.surface, { backgroundColor: Colors.disabled }]}>
          <Text style={{ color: Colors.onDisabled }}>{label}</Text>
        </View>
      ) : tone === 'neutral' ? (
        <LinearGradient
          colors={NeutralGradient.colors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.surface}>
          <Text style={{ color: textColor }}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.surface, { backgroundColor: RoleColors[tone].accent }]}>
          <Text style={{ color: textColor }}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: MinTouchTarget, // RNF-35
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  surface: {
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
