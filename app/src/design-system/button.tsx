import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { EaseOut } from './motion';
import { Text } from './text';
import { ButtonVariants, Colors, MinTouchTarget, NeutralGradient, Radius, RoleColors, Spacing } from './tokens';

// `neutral` é o botão das telas anteriores ao login, que não escolhem lado e usam o gradiente.
// `patient` e `psychologist` entram depois do login, cada um com a cor do seu lado.
export type ButtonTone = 'neutral' | 'patient' | 'psychologist';

// `primary` é a ação principal, cheia na cor do lado. `secondary` e `destructive` são contorno
// e não mudam com o lado: as cores de lado reprovam como texto ou borda sobre o branco.
export type ButtonVariant = 'primary' | 'secondary' | 'destructive';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  variant?: ButtonVariant;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  tone = 'neutral',
  variant = 'primary',
  disabled = false,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const reduced = useReducedMotion();
  // Quem encolhe é a superfície, não o Pressable: o alvo de toque fica do mesmo tamanho.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.pressable, style]}>
      {({ pressed }) => (
        <Animated.View style={[styles.clip, {
          transform: [{ scale: pressed && !disabled && !reduced ? 0.97 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: 120,
          transitionTimingFunction: EaseOut,
        }]}>
          <Surface label={label} tone={tone} variant={variant} disabled={disabled} />
        </Animated.View>
      )}
    </Pressable>
  );
}

function Surface({ label, tone, variant, disabled }: { label: string; tone: ButtonTone; variant: ButtonVariant; disabled: boolean }) {
  if (disabled) {
    return (
      <View style={[styles.surface, { backgroundColor: Colors.disabled }]}>
        <Text style={{ color: Colors.onDisabled }}>{label}</Text>
      </View>
    );
  }

  if (variant !== 'primary') {
    const colors = ButtonVariants[variant];
    return (
      <View style={[styles.surface, styles.outline, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={{ color: colors.text }}>{label}</Text>
      </View>
    );
  }

  // O texto sobre cor é sempre Dark: branco reprova o contraste em todas as cores (5.4).
  if (tone === 'neutral') {
    return (
      <LinearGradient
        colors={NeutralGradient.colors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.surface}>
        <Text style={{ color: NeutralGradient.onGradient }}>{label}</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.surface, { backgroundColor: RoleColors[tone].accent }]}>
      <Text style={{ color: RoleColors[tone].onAccent }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: MinTouchTarget, // RNF-35
  },
  clip: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  surface: {
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 2,
    borderRadius: Radius.md,
  },
});
