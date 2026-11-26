import { StyleSheet, View } from 'react-native';

import type { ImageKind } from '@/api';
import { Chip, Spacing, Text } from '@/design-system';
import type { useProfileImages } from './use-profile-images';

const LABELS: Record<ImageKind, { change: string; remove: string }> = {
  avatar: { change: 'Trocar foto', remove: 'Remover foto' },
  cover: { change: 'Trocar capa', remove: 'Remover capa' },
};

// Trocar e remover foto e capa, nas telas de perfil dos dois lados. Ação rara (R7): chips de
// contorno numa linha, e "Remover" só aparece quando há o que remover.
export function ProfileImageActions({ tone, images }: {
  tone: 'patient' | 'psychologist'; images: ReturnType<typeof useProfileImages>;
}) {
  const urls: Record<ImageKind, string | null> = { avatar: images.avatarUrl, cover: images.coverUrl };
  const chip = (kind: ImageKind, action: 'change' | 'remove') => <Chip key={`${kind}-${action}`} tone={tone}
    label={images.busy === kind ? 'Aguarde...' : LABELS[kind][action]} disabled={images.busy !== null}
    onPress={() => images[action](kind)} />;
  return <View style={styles.group}>
    <View style={styles.row}>
      {chip('avatar', 'change')}
      {chip('cover', 'change')}
      {urls.avatar ? chip('avatar', 'remove') : null}
      {urls.cover ? chip('cover', 'remove') : null}
    </View>
    {images.error ? <Text color="error" accessibilityRole="alert">{images.error}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
