import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { Colors, MaxContentWidth, Spacing } from './tokens';

type ScreenProps = {
  children: ReactNode;
  // Telas com formulário rolam, para o teclado não cobrir o botão.
  scroll?: boolean;
  // Centraliza na vertical. Só para tela de conteúdo único e curto (carregando, aviso de
  // espera): em lista ou formulário a metade de cima fica vazia quando há pouco item.
  center?: boolean;
};

// Base de toda tela: fundo branco (a identidade pede fundo majoritariamente branco), área
// segura do aparelho e conteúdo a partir do topo, centrado na horizontal com largura máxima
// em tela grande.
export function Screen({ children, scroll = false, center = false }: ScreenProps) {
  const containerStyle = [styles.container, center && styles.center];

  return (
    <SafeAreaView style={styles.root}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={containerStyle}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets>
          <View style={styles.content}>{children}</View>
        </ScrollView>
      ) : (
        <View style={[containerStyle, styles.fill]}>
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
  // `flexGrow` faz o conteúdo da rolagem ocupar a altura toda, que é o que permite o `center`
  // funcionar também com `scroll`.
  container: {
    flexGrow: 1,
    padding: Spacing.four,
  },
  center: {
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
  },
});
