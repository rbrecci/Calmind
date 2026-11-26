import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon, type IconName } from './icon';
import { Colors, FieldColors, Radius, RoleColors, Spacing } from './tokens';
import { Typography } from './typography';

const SEND: IconName = { ios: 'arrow.right', android: 'arrow_forward' };

// Altura do campo de uma linha e lado do botão quadrado, como no protótipo; passa dos 44 (RNF-35).
const ROW_HEIGHT = 56;

export type MessageComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  tone: 'patient' | 'psychologist';
  sending?: boolean;
  maxLength?: number;
};

// Rodapé da conversa: campo branco e botão quadrado na cor do lado, com a seta, na mesma linha.
// Sem rótulo visível, o nome estável para o leitor de tela vem do accessibilityLabel (RNF-35).
export function MessageComposer({ value, onChangeText, onSend, tone, sending = false, maxLength = 2000 }: MessageComposerProps) {
  const disabled = sending || !value.trim();
  return (
    <View style={styles.row}>
      <TextInput
        accessibilityLabel="Texto da mensagem"
        placeholder="Escreva uma mensagem"
        placeholderTextColor={FieldColors.placeholder}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        editable={!sending}
        multiline
        // Na web o campo vira textarea de duas linhas e fica mais alto que o botão. No celular
        // fica sem valor, para o campo crescer com o texto.
        numberOfLines={Platform.OS === 'web' ? 1 : undefined}
        style={styles.input}
      />
      {/* A seta é Dark sobre a cor do lado, como todo texto sobre cor (5.4). Enviando, o estado
          vai para o leitor de tela pelo `busy`, já que o botão não tem texto. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Enviar"
        accessibilityState={{ disabled, busy: sending }}
        disabled={disabled}
        onPress={onSend}
        style={({ pressed }) => [styles.send, {
          backgroundColor: disabled ? Colors.disabled : RoleColors[tone].accent,
          opacity: pressed ? 0.8 : 1,
        }]}>
        <Icon name={SEND} color={disabled ? Colors.onDisabled : RoleColors[tone].onAccent} />
      </Pressable>
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
    minHeight: ROW_HEIGHT,
    // Cinco linhas; acima disso o campo rola, para o rodapé não engolir a conversa.
    maxHeight: Typography.body.lineHeight * 5 + Spacing.three * 2,
    borderWidth: 1,
    borderColor: FieldColors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    backgroundColor: FieldColors.background,
    color: Colors.text,
  },
  send: {
    width: ROW_HEIGHT,
    height: ROW_HEIGHT,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
