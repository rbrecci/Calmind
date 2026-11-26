import { StyleSheet, View } from 'react-native';

import type { StatusTagKind } from './status-kind';
import { Text } from './text';
import { Radius, Spacing, StatusTagColors } from './tokens';

export type StatusTagProps = {
  kind: StatusTagKind;
  label: string;
};

// Status em pílula, para não se confundir com o texto corrido do cartão. Não é tocável, por
// isso não leva o alvo de 44; o leitor de tela lê só o rótulo.
export function StatusTag({ kind, label }: StatusTagProps) {
  const colors = StatusTagColors[kind];
  return (
    <View style={[styles.tag, { backgroundColor: colors.background }]}>
      <Text variant="small" style={{ color: colors.text }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.md,
  },
});
