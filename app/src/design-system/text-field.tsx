import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './text';
import { Colors, MinTouchTarget, Radius, Spacing } from './tokens';
import { Typography } from './typography';

export type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label: string;
  error?: string;
};

// O rótulo fica visível acima do campo, e não só no placeholder: quando o usuário começa a
// digitar o placeholder some, e leitor de tela precisa de um nome estável (RNF-35).
export function TextField({ label, error, accessibilityLabel, ...inputProps }: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text variant="small">{label}</Text>

      <TextInput
        accessibilityLabel={accessibilityLabel ?? label}
        placeholderTextColor={Colors.textSecondary}
        style={[styles.input, { borderColor: error ? Colors.error : Colors.border }]}
        {...inputProps}
      />

      {/* Abaixo do campo, no fundo branco: dentro do cinza o vermelho reprova o contraste. */}
      {error ? (
        <Text variant="small" color="error" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  input: {
    ...Typography.body,
    minHeight: MinTouchTarget, // RNF-35
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    backgroundColor: Colors.surface,
    color: Colors.text,
  },
});
