import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Appear } from './appear';
import type { StatusTagKind } from './status-kind';
import { StatusTag } from './status-tag';
import { Text } from './text';
import { Colors, MinTouchTarget, Radius, Spacing } from './tokens';

export type ExpandableCardProps = {
  title: string;
  tag?: { kind: StatusTagKind; label: string };
  expanded: boolean;
  onToggle: () => void;
  // Item encerrado, como a tarefa concluída: título em cinza. Cinza e não transparência, que
  // derrubaria o texto abaixo de 4,5:1.
  muted?: boolean;
  // O que aparece com o cartão aberto: descrição e ação.
  children?: ReactNode;
};

// Cartão compacto que abre no lugar: fechado mostra só o título e a etiqueta; aberto, o resto.
// A linha do título é o botão, e o que abre fica fora dele, para a ação de dentro ser tocável.
export function ExpandableCard({ title, tag, expanded, onToggle, muted = false, children }: ExpandableCardProps) {
  return (
    <Appear style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={tag ? `${title}, ${tag.label}` : title}
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        onPress={onToggle}
        style={styles.header}>
        <Text color={muted ? 'textSecondary' : 'text'} style={styles.title}>{title}</Text>
        {tag ? <StatusTag kind={tag.kind} label={tag.label} /> : null}
      </Pressable>
      {expanded && children ? <View style={styles.body}>{children}</View> : null}
    </Appear>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  header: {
    minHeight: MinTouchTarget + Spacing.three, // RNF-35, com folga para o cartão não ficar espremido
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  title: {
    flex: 1,
  },
  body: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
});
