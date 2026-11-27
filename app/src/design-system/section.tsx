import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './text';
import { Spacing } from './tokens';

// Grupo com título, como as seções da tela de conta.
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="small" color="textSecondary" accessibilityRole="header">{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
});
