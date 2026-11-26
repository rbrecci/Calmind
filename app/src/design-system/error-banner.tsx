import { StyleSheet, View } from 'react-native';

import { Text } from './text';
import { ErrorBannerColors, Radius, Spacing } from './tokens';

// Erro do formulário inteiro em bloco, no topo dele, como a falha do login: fundo no tom claro
// do Danger e texto Dark. Erro de um campo continua abaixo do campo.
export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={{ color: ErrorBannerColors.text }}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: ErrorBannerColors.border,
    borderRadius: Radius.md,
    backgroundColor: ErrorBannerColors.background,
  },
});
