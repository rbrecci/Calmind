import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { Colors, MaxContentWidth, Spacing } from './tokens';

type ScreenProps = {
  children: ReactNode;
  // Telas com formulário rolam, para o teclado não cobrir o botão.
  scroll?: boolean;
};

// Base de toda tela: fundo branco (a identidade pede fundo majoritariamente branco), área
// segura do aparelho e conteúdo centralizado, com largura máxima em tela grande.
export function Screen({ children, scroll = false }: ScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets>
          <View style={styles.content}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[styles.scrollContent, styles.fill]}>
          <View style={styles.content}>{children}</View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
  },
});
