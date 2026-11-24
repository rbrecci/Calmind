import { Pressable, StyleSheet, View } from 'react-native';

import type { ButtonTone } from './button';
import { Text } from './text';
import { Colors, MinTouchTarget, Radius, RoleColors, Spacing } from './tokens';

export type ListItemProps = {
  title: string;
  onPress: () => void;
  description?: string;
  // Contador ao lado da seta, como as notificações não lidas.
  badge?: number | string;
  tone?: ButtonTone;
  disabled?: boolean;
  accessibilityLabel?: string;
};

// Linha de menu que leva a outra tela. A seta à direita é o que diz "isto abre algo"; sem ela
// o item parece texto solto. O app não tem biblioteca de ícone, por isso a seta é caractere.
export function ListItem({
  title,
  onPress,
  description,
  badge,
  tone = 'neutral',
  disabled = false,
  accessibilityLabel,
}: ListItemProps) {
  // O leitor de tela lê a linha inteira como um botão só, então o contador entra no nome.
  const label = accessibilityLabel ?? [title, badge === undefined ? null : String(badge), description].filter(Boolean).join(', ');
  const badgeColors = tone === 'neutral'
    ? { backgroundColor: Colors.surface, color: Colors.text }
    : { backgroundColor: RoleColors[tone].accent, color: RoleColors[tone].onAccent };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.texts}>
        <Text color={disabled ? 'textSecondary' : 'text'}>{title}</Text>
        {description ? <Text variant="small" color="textSecondary">{description}</Text> : null}
      </View>

      {badge !== undefined ? (
        <View style={[styles.badge, { backgroundColor: badgeColors.backgroundColor }]}>
          <Text variant="small" style={{ color: badgeColors.color }}>{badge}</Text>
        </View>
      ) : null}

      <Text variant="h4" color="textSecondary" importantForAccessibility="no" accessibilityElementsHidden>
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MinTouchTarget, // RNF-35
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  pressed: {
    backgroundColor: Colors.surface,
  },
  texts: {
    flex: 1,
    gap: Spacing.half,
  },
  badge: {
    minWidth: 28,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
});
