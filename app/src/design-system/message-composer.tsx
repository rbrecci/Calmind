import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from './button';
import { Colors, MinTouchTarget, Radius, Spacing } from './tokens';
import { Typography } from './typography';

export type MessageComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  tone: 'patient' | 'psychologist';
  sending?: boolean;
  maxLength?: number;
};

// Rodapé da conversa: campo e botão na mesma linha, para o histórico ficar com a tela. Sem
// rótulo visível, o nome estável para o leitor de tela vem do accessibilityLabel (RNF-35).
export function MessageComposer({ value, onChangeText, onSend, tone, sending = false, maxLength = 2000 }: MessageComposerProps) {
  return (
    <View style={styles.row}>
      <TextInput
        accessibilityLabel="Texto da mensagem"
        placeholder="Escreva uma mensagem"
        placeholderTextColor={Colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        editable={!sending}
        multiline
        style={styles.input}
      />
      <Button tone={tone} label={sending ? 'Enviando...' : 'Enviar'} accessibilityLabel="Enviar mensagem"
        disabled={sending || !value.trim()} onPress={onSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  // O botão desce junto com a última linha quando o campo cresce.
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  input: {
    ...Typography.body,
    flex: 1,
    minHeight: MinTouchTarget, // RNF-35
    // Cinco linhas; acima disso o campo rola, para o rodapé não engolir a conversa.
    maxHeight: Typography.body.lineHeight * 5 + Spacing.two * 2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: Colors.surface,
    color: Colors.text,
  },
});
