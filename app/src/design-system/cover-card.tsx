import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Avatar } from './avatar';
import { Cover } from './cover';
import { EaseOut } from './motion';
import type { StatusTagKind } from './status-kind';
import { StatusTag } from './status-tag';
import { Text } from './text';
import { Colors, Radius, Spacing } from './tokens';

export type CoverCardProps = {
  tone: 'patient' | 'psychologist';
  name: string;
  avatarUri?: string | null;
  coverUri?: string | null;
  headers?: Record<string, string>;
  tag?: { kind: StatusTagKind; label: string };
  // Linha curta abaixo do nome, como a próxima consulta. Sem ela, a linha some (R2).
  description?: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

const AVATAR = 64;
const RING = 3;

// Cartão de uma pessoa com capa, como "Seu vínculo" no início do paciente. Tocável inteiro (R4):
// leva ao perfil. O avatar é decorativo, porque o nome está escrito no cartão.
export function CoverCard({ tone, name, avatarUri, coverUri, headers, tag, description, onPress, accessibilityLabel }: CoverCardProps) {
  const label = accessibilityLabel ?? [name, tag?.label, description].filter(Boolean).join(', ');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      {({ pressed }) => <Animated.View style={[styles.card, {
        backgroundColor: pressed ? Colors.surface : Colors.background,
        transitionProperty: 'backgroundColor',
        transitionDuration: 120,
        transitionTimingFunction: EaseOut,
      }]}>
        <Cover tone={tone} uri={coverUri} headers={headers} height={84} />
        <View style={styles.row}>
          {/* Anel branco: separa a foto da capa quando as duas são escuras. */}
          <View style={styles.ring}>
            <Avatar tone={tone} name={name} size={AVATAR} uri={avatarUri} headers={headers} />
          </View>
          {tag ? <View style={styles.tag}><StatusTag kind={tag.kind} label={tag.label} /></View> : null}
        </View>
        <View style={styles.texts}>
          <Text variant="h5">{name}</Text>
          {description ? <Text color="textSecondary">{description}</Text> : null}
        </View>
      </Animated.View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
    paddingBottom: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: -(AVATAR / 2),
    paddingHorizontal: Spacing.three,
  },
  ring: {
    borderWidth: RING,
    borderColor: Colors.background,
    borderRadius: (AVATAR + RING * 2) / 2,
    backgroundColor: Colors.background,
  },
  tag: { paddingBottom: Spacing.one },
  texts: { gap: Spacing.half, paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
});
