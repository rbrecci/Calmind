import { StyleSheet, TextInput } from 'react-native';

import { ButtonVariants, Colors, Radius, Spacing } from './tokens';
import { Typography } from './typography';

export type CodeFieldProps = {
  value: string;
  onChangeText: (code: string) => void;
  length: number;
  // Sem rótulo visível: o texto acima do campo diz o que digitar, e o leitor de tela ouve este nome.
  accessibilityLabel: string;
  editable?: boolean;
  // Erro: borda no vermelho de texto. A mensagem fica fora do campo, num `ErrorBanner`.
  invalid?: boolean;
  onSubmitEditing?: () => void;
};

// Campo grande de código curto, como o convite: letras espaçadas e centralizadas, para ler e
// conferir caractere por caractere. Maiúsculas e sem espaço, que o código não tem.
export function CodeField({ value, onChangeText, length, accessibilityLabel, editable = true, invalid = false, onSubmitEditing }: CodeFieldProps) {
  return (
    <TextInput
      accessibilityLabel={accessibilityLabel}
      value={value}
      onChangeText={(text) => onChangeText(text.toUpperCase().replace(/\s/g, ''))}
      maxLength={length}
      autoCapitalize="characters"
      autoCorrect={false}
      autoComplete="off"
      spellCheck={false}
      editable={editable}
      returnKeyType="done"
      onSubmitEditing={onSubmitEditing}
      style={[styles.input, { borderColor: invalid ? Colors.error : ButtonVariants.secondary.border }]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    ...Typography.h3,
    minHeight: 72,
    letterSpacing: Spacing.two,
    textAlign: 'center',
    borderWidth: 2,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    backgroundColor: Colors.background,
    color: Colors.text,
  },
});
