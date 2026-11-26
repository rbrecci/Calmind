import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Appear } from './appear';
import { Text } from './text';
import { Colors, Radius, RoleColors, Spacing } from './tokens';

// Grupo de um dia da conversa: o separador centralizado ("Segunda, 17/11") e os balões dele.
export function MessageDay({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text variant="small" color="textSecondary" accessibilityRole="header" style={styles.day}>{label}</Text>
      {children}
    </View>
  );
}

export type MessageBubbleProps = {
  body: string;
  // Hora curta ("15:00") e, só na última minha, o estado: "15:00 · Lida".
  meta: string;
  mine: boolean;
  tone: 'patient' | 'psychologist';
  // O nome lido pelo leitor de tela: quem falou, o texto, a data completa e o estado.
  accessibilityLabel: string;
  selectable?: boolean;
};

// Balão de mensagem. A minha fica à direita na cor do lado; a outra, à esquerda no cinza. A hora
// vai pequena no canto do balão: em Dark na minha, porque o cinza de apoio reprova sobre o rosa
// (2,7:1), e em cinza na outra, onde passa.
export function MessageBubble({ body, meta, mine, tone, accessibilityLabel, selectable }: MessageBubbleProps) {
  return (
    <Appear rise accessible accessibilityLabel={accessibilityLabel}
      style={[styles.bubble, mine ? { alignSelf: 'flex-end', backgroundColor: RoleColors[tone].accent } : styles.theirs]}>
      <Text selectable={selectable}>{body}</Text>
      <Text variant="small" color={mine ? 'text' : 'textSecondary'} style={styles.meta}>{meta}</Text>
    </Appear>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two,
  },
  day: {
    textAlign: 'center',
    paddingVertical: Spacing.one,
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
    borderRadius: Radius.md,
  },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
  },
  meta: {
    alignSelf: 'flex-end',
  },
});
