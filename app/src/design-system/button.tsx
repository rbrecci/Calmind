import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { Icon, type IconName } from './icon';
import { EaseOut } from './motion';
import { Text } from './text';
import { FontFamily } from './typography';
import { ButtonVariants, Colors, MinTouchTarget, NeutralGradient, Radius, RoleColors, Spacing } from './tokens';

// `neutral` é o botão das telas anteriores ao login, que não escolhem lado e usam o gradiente:
// o principal é contorno e texto em degradê sobre branco. `patient` e `psychologist` entram
// depois do login, cada um cheio na cor do seu lado.
export type ButtonTone = 'neutral' | 'patient' | 'psychologist';

// `primary` é a ação principal, cheia na cor do lado. `secondary` e `destructive` são contorno
// e não mudam com o lado: as cores de lado reprovam como texto ou borda sobre o branco.
export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'hero';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  variant?: ButtonVariant;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  minHeight?: number;
  // Desenho antes do rótulo (no destaque do início, depois). Sempre decorativo.
  icon?: IconName;
};

export function Button({
  label,
  onPress,
  tone = 'neutral',
  variant = 'primary',
  disabled = false,
  accessibilityLabel,
  style,
  minHeight = MinTouchTarget,
  icon,
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
      style={[styles.pressable, { minHeight }, style]}>
      {({ pressed }) => (
        <Animated.View style={[styles.clip, {
          transform: [{ scale: pressed && !disabled && !reduced ? 0.97 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: 120,
          transitionTimingFunction: EaseOut,
        }]}>
          <Surface label={label} tone={tone} variant={variant} disabled={disabled} minHeight={minHeight} icon={icon} />
        </Animated.View>
      )}
    </Pressable>
  );
}

function Surface({ label, tone, variant, disabled, minHeight, icon }: { label: string; tone: ButtonTone; variant: ButtonVariant; disabled: boolean; minHeight: number; icon?: IconName }) {
  const content = (color: string, textStyle?: TextStyle) => <View style={styles.content}>
    {icon ? <Icon name={icon} size={20} color={color} /> : null}
    <Text style={[{ color, flexShrink: 1 }, textStyle]}>{label}</Text>
  </View>;

  if (disabled) {
    return (
      <View style={[styles.surface, { minHeight, backgroundColor: Colors.disabled }]}>
        {content(Colors.onDisabled)}
      </View>
    );
  }

  if (variant === 'hero') {
    return <View style={[styles.surface, styles.content, { minHeight, backgroundColor: Colors.background }]}>
      <Text style={{ fontFamily: FontFamily.heading }}>{label}</Text>
      {icon ? <Icon name={icon} size={18} /> : null}
    </View>;
  }

  if (variant !== 'primary') {
    const colors = ButtonVariants[variant];
    return (
      <View style={[styles.surface, styles.outline, { minHeight, backgroundColor: colors.background, borderColor: colors.border }]}>
        {content(colors.text)}
      </View>
    );
  }

  // Contorno de 2 pontos: o degradê preenche o fundo e o miolo branco cobre tudo menos a borda.
  // Exceção ao AA decidida pelo dono do projeto, medida em tokens.test.ts.
  if (tone === 'neutral') {
    return (
      <LinearGradient
        colors={NeutralGradient.colors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.gradientBorder, { minHeight }]}>
        <View style={[styles.gradientInner, { minHeight: minHeight - 4 }]}>
          <View style={styles.content}>
            {icon ? <Icon name={icon} size={20} color={NeutralGradient.textFallback} /> : null}
            <GradientLabel label={label} />
          </View>
        </View>
      </LinearGradient>
    );
  }

  // O texto sobre cor é sempre Dark: branco reprova o contraste em todas as cores (5.4).
  return (
    <View style={[styles.surface, { minHeight, backgroundColor: RoleColors[tone].accent }]}>
      {content(RoleColors[tone].onAccent)}
    </View>
  );
}

// Texto em degradê: o texto vira a máscara de um degradê do tamanho dele. Na web o MaskedView
// não recorta (desenha o degradê e o texto um sobre o outro), então lá o texto fica sólido no
// rosa -1, que passa 4,5:1 no branco. O nome lido vem do Pressable, por isso nada aqui é lido.
function GradientLabel({ label }: { label: string }) {
  if (Platform.OS === 'web') return <Text style={{ color: NeutralGradient.textFallback }}>{label}</Text>;
  return (
    <MaskedView
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      maskElement={<Text style={{ color: Colors.text }}>{label}</Text>}>
      <LinearGradient colors={NeutralGradient.textColors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}>
        <Text style={styles.hidden}>{label}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: MinTouchTarget, // RNF-35
  },
  clip: {
    borderRadius: Radius.control,
    overflow: 'hidden',
  },
  surface: {
    minHeight: MinTouchTarget,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two, maxWidth: '100%' },
  outline: {
    borderWidth: 2,
    borderRadius: Radius.control,
  },
  gradientBorder: {
    minHeight: MinTouchTarget,
    padding: 2,
  },
  gradientInner: {
    flexGrow: 1,
    minHeight: MinTouchTarget - 4,
    paddingHorizontal: Spacing.four - 2,
    borderRadius: Radius.control - 2,
    paddingVertical: Spacing.two - 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  // Só dá o tamanho do degradê: quem aparece é a máscara.
  hidden: {
    opacity: 0,
  },
});
