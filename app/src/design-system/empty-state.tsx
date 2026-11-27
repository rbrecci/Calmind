import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Illustration, type IllustrationName } from './illustration';
import { Text } from './text';
import { Spacing } from './tokens';

export type EmptyStateProps = {
  illustration: IllustrationName;
  // Curto e sem ponto final (R1): "Nenhuma tarefa por enquanto".
  title: string;
  description?: string;
  // Ação opcional, como um `Button` que resolve o vazio.
  children?: ReactNode;
};

// Tela inteira vazia: ocupa a altura que sobra e centraliza a imagem e a mensagem. Quem usa não
// mostra mais nada junto. Seção pequena vazia continua texto: ilustração em toda seção vazia
// transforma a tela num mural.
export function EmptyState({ illustration, title, description, children }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Illustration name={illustration} />
      <Text variant="h5" style={styles.text}>{title}</Text>
      {description ? <Text color="textSecondary" style={styles.text}>{description}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignSelf: 'stretch', gap: Spacing.three, paddingVertical: Spacing.four },
  text: { textAlign: 'center' },
});
