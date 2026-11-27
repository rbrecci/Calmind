import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from './avatar';
import { Cover } from './cover';
import { Icon } from './icon';
import { Text } from './text';
import { Colors, MinTouchTarget, Radius, Spacing } from './tokens';

export type ProfileHeaderProps = {
  tone: 'patient' | 'psychologist';
  name: string;
  // Linha abaixo do nome, como o CRP.
  subtitle?: string;
  avatarUri?: string | null;
  coverUri?: string | null;
  headers?: Record<string, string>;
  // Só no próprio perfil: botão de editar sobre o banner, que reúne foto e banner.
  onEdit?: () => void;
};

const AVATAR = 96;
const RING = 4;

// Topo das telas de perfil: banner ao fundo, avatar sobreposto à base dele e o nome ao centro. Sem
// banner escolhido, a faixa fica no degradê do lado. O avatar é decorativo, porque o nome está ali.
export function ProfileHeader({ tone, name, subtitle, avatarUri, coverUri, headers, onEdit }: ProfileHeaderProps) {
  return (
    <View style={styles.root}>
      <View>
        <Cover tone={tone} uri={coverUri} headers={headers} height={160} style={styles.cover} />
        {onEdit ? <Pressable accessibilityRole="button" accessibilityLabel="Editar foto e banner" onPress={onEdit}
          style={({ pressed }) => [styles.edit, pressed && { backgroundColor: Colors.surface }]}>
          <Icon name="pencil" size={20} />
        </Pressable> : null}
      </View>
      {/* Anel branco: separa a foto do banner quando as duas são escuras. */}
      <View style={styles.ring}>
        <Avatar tone={tone} name={name} size={AVATAR} uri={avatarUri} headers={headers} />
      </View>
      <View style={styles.texts}>
        <Text variant="h4" style={styles.center}>{name}</Text>
        {subtitle ? <Text variant="small" color="textSecondary" style={styles.center}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.two },
  cover: { borderRadius: Radius.md },
  edit: {
    position: 'absolute', top: Spacing.two, right: Spacing.two, width: MinTouchTarget, height: MinTouchTarget,
    borderRadius: MinTouchTarget / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background,
  },
  ring: {
    alignSelf: 'center',
    marginTop: -(AVATAR / 2) - Spacing.two,
    borderWidth: RING,
    borderColor: Colors.background,
    borderRadius: (AVATAR + RING * 2) / 2,
    backgroundColor: Colors.background,
  },
  texts: { gap: Spacing.half },
  center: { textAlign: 'center' },
});
