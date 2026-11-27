import { StyleSheet, View } from 'react-native';

import { Avatar } from './avatar';
import { Cover } from './cover';
import { Text } from './text';
import { Colors, Radius, Spacing } from './tokens';

export type ProfileHeaderProps = {
  tone: 'patient' | 'psychologist';
  name: string;
  // Linha abaixo do nome, como o CRP.
  subtitle?: string;
  avatarUri?: string | null;
  coverUri?: string | null;
  headers?: Record<string, string>;
};

const AVATAR = 88;
const RING = 4;

// Topo das telas de perfil: capa, avatar sobreposto à base dela e o nome ao lado. O avatar é
// decorativo, porque o nome está escrito logo ali.
export function ProfileHeader({ tone, name, subtitle, avatarUri, coverUri, headers }: ProfileHeaderProps) {
  return (
    <View>
      {coverUri ? <Cover tone={tone} uri={coverUri} headers={headers} height={140} style={styles.cover} /> : null}
      <View style={[styles.row, !coverUri && styles.compactRow]}>
        {/* Anel branco: separa a foto da capa quando as duas são escuras. */}
        <View style={styles.ring}>
          <Avatar tone={tone} name={name} size={coverUri ? AVATAR : 64} uri={avatarUri} headers={headers} />
        </View>
        <View style={[styles.texts, !coverUri && styles.compactTexts]}>
          <Text variant="h5">{name}</Text>
          {subtitle ? <Text variant="small" color="textSecondary">{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactRow: { marginTop: 0, paddingHorizontal: 0, alignItems: 'center' },
  compactTexts: { paddingTop: 0 },
  cover: { borderRadius: Radius.md },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    marginTop: -(AVATAR / 2),
    paddingHorizontal: Spacing.three,
  },
  ring: {
    borderWidth: RING,
    borderColor: Colors.background,
    borderRadius: (AVATAR + RING * 2) / 2,
    backgroundColor: Colors.background,
  },
  // Começa abaixo da capa: texto Dark sobre a foto de capa não teria contraste garantido.
  texts: { flex: 1, gap: Spacing.half, paddingTop: AVATAR / 2 + RING + Spacing.two },
});
