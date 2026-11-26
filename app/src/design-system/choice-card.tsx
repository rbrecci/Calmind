import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { Icon, type IconName } from './icon';
import { EaseOut } from './motion';
import { Text } from './text';
import { Colors, MinTouchTarget, Radius, RoleColors, Spacing } from './tokens';

const CHEVRON: IconName = { ios: 'chevron.right', android: 'chevron_right' };

export type ChoiceCardProps = {
  title: string;
  description: string;
  tone: 'patient' | 'psychologist';
  onPress: () => void;
};

// Cartão grande tocável inteiro, para escolher entre caminhos, como "Sou paciente" e "Sou
// psicólogo". O fundo vai do branco ao tom claro do lado. Título e descrição em Dark: o texto
// de apoio cinza reprova sobre o tom claro do psicólogo (3,5:1).
export function ChoiceCard({ title, description, tone, onPress }: ChoiceCardProps) {
  const reduced = useReducedMotion();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${description}`} onPress={onPress}>
      {({ pressed }) => (
        <Animated.View style={[styles.card, {
          transform: [{ scale: pressed && !reduced ? 0.98 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: 120,
          transitionTimingFunction: EaseOut,
        }]}>
          <LinearGradient colors={[Colors.background, RoleColors[tone].tint]} start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill} />
          <View style={styles.texts}>
            <Text variant="h5">{title}</Text>
            <Text variant="small">{description}</Text>
          </View>
          <Icon name={CHEVRON} size={20} />
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: MinTouchTarget, // RNF-35
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  texts: {
    flex: 1,
    gap: Spacing.two,
  },
});
