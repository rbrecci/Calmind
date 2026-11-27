import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { ButtonTone } from './button';
import { EaseOut } from './motion';
import { Text } from './text';
import { Icon, type IconName } from './icon';
import { Colors, MinTouchTarget, Radius, RoleColors, Spacing } from './tokens';
import { FontFamily } from './typography';

export type ListItemProps = {
  title: string;
  onPress: () => void;
  description?: string;
  // Segunda linha curta abaixo da descrição, como "1 tarefa vencida".
  detail?: string;
  // Não lida: ponto à esquerda e título no peso dos títulos. O estado não entra no nome lido
  // pelo leitor de tela; quem usa passa um `accessibilityLabel` que o diga.
  unread?: boolean;
  // Contador ao lado da seta, como as notificações não lidas.
  badge?: number | string;
  tone?: ButtonTone;
  disabled?: boolean;
  accessibilityLabel?: string;
  // Desenho à esquerda, num círculo no tom claro do lado.
  icon?: IconName;
};

// Linha de menu que leva a outra tela. A seta Phosphor à direita indica a navegação.
export function ListItem({
  title,
  onPress,
  description,
  detail,
  unread = false,
  badge,
  tone = 'neutral',
  disabled = false,
  accessibilityLabel,
  icon,
}: ListItemProps) {
  // O leitor de tela lê a linha inteira como um botão só, então o contador entra no nome.
  const label = accessibilityLabel ?? [title, badge === undefined ? null : String(badge), description, detail].filter(Boolean).join(', ');
  const badgeColors = tone === 'neutral'
    ? { backgroundColor: Colors.surface, color: Colors.text }
    : { backgroundColor: RoleColors[tone].accent, color: RoleColors[tone].onAccent };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}>
      {/* Linha larga não encolhe ao toque: só o fundo clareia. É cor, não movimento, então fica
          igual com "reduzir movimento". */}
      {({ pressed }) => <Animated.View style={[styles.row, {
        backgroundColor: pressed ? Colors.surface : Colors.background,
        transitionProperty: 'backgroundColor',
        transitionDuration: 120,
        transitionTimingFunction: EaseOut,
      }]}>
        {/* Dark e não a cor do lado: o ponto é a única marca visual da não lida, e as cores de lado
            reprovam o contraste de 3:1 sobre o branco. */}
        {unread ? <View style={styles.dot} /> : null}

        {icon ? <View style={[styles.icon, { backgroundColor: tone === 'neutral' ? Colors.surface : RoleColors[tone].tint }]}>
          <Icon name={icon} size={20} />
        </View> : null}

        <View style={styles.texts}>
          <Text color={disabled ? 'textSecondary' : 'text'} style={unread ? styles.unreadTitle : undefined}>{title}</Text>
          {description ? <Text variant="small" color="textSecondary">{description}</Text> : null}
          {detail ? <Text variant="small">{detail}</Text> : null}
        </View>

        {badge !== undefined ? (
          <View style={[styles.badge, { backgroundColor: badgeColors.backgroundColor }]}>
            <Text variant="small" style={{ color: badgeColors.color }}>{badge}</Text>
          </View>
        ) : null}

        <Icon name="caret-right" color={Colors.textSecondary} size={20} />
      </Animated.View>}
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
  },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  texts: {
    flex: 1,
    gap: Spacing.half,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.text,
  },
  unreadTitle: {
    fontFamily: FontFamily.heading,
  },
  badge: {
    minWidth: 28,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
});
