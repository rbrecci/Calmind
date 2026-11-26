import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Avatar } from './avatar';
import { EaseOut } from './motion';
import type { StatusTagKind } from './status-kind';
import { StatusTag } from './status-tag';
import { Text } from './text';
import { Colors, MinTouchTarget, Radius, Spacing } from './tokens';
import { FontFamily } from './typography';

export type PersonCardProps = {
  tone: 'patient' | 'psychologist';
  name: string;
  avatarUri?: string | null;
  headers?: Record<string, string>;
  // Etiqueta à direita do nome: o estado mais importante, como "2 não lidas", ou o CRP.
  tag?: { kind: StatusTagKind; label: string } | null;
  // Linha de resumo abaixo, com as partes separadas por " · " (R3).
  description?: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

// Cartão de pessoa numa lista (pacientes do psicólogo, profissionais do catálogo). Tocável
// inteiro (R4), com avatar pequeno e decorativo, já que o nome está ao lado.
export function PersonCard({ tone, name, avatarUri, headers, tag, description, onPress, accessibilityLabel }: PersonCardProps) {
  const label = accessibilityLabel ?? [name, tag?.label, description].filter(Boolean).join(', ');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      {({ pressed }) => <Animated.View style={[styles.card, {
        backgroundColor: pressed ? Colors.surface : Colors.background,
        transitionProperty: 'backgroundColor',
        transitionDuration: 120,
        transitionTimingFunction: EaseOut,
      }]}>
        {avatarUri ? <Avatar tone={tone} name={name} size={40} uri={avatarUri} headers={headers} /> : null}
        <View style={styles.texts}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{name}</Text>
            {tag ? <StatusTag kind={tag.kind} label={tag.label} /> : null}
          </View>
          {description ? <Text variant="small" color="textSecondary">{description}</Text> : null}
        </View>
      </Animated.View>}
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
  },
  texts: { flex: 1, gap: Spacing.one },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two },
  name: { flexShrink: 1, marginRight: 'auto', fontFamily: FontFamily.heading },
});
