import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './text';
import { Colors, FieldColors, Radius, Spacing } from './tokens';
import { Typography } from './typography';

export type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label: string;
  error?: string;
};

// Altura do campo de uma linha, como no protótipo; passa do alvo de toque de 44 (RNF-35).
export const FIELD_HEIGHT = 52;

// O rótulo fica visível acima do campo, e não só no placeholder: quando o usuário começa a
// digitar o placeholder some, e leitor de tela precisa de um nome estável (RNF-35).
export function TextField({ label, error, accessibilityLabel, multiline, numberOfLines, ...inputProps }: TextFieldProps) {
  // Área de texto: a altura acompanha as linhas pedidas, e o texto começa no alto.
  const area = multiline ? {
    minHeight: Typography.body.lineHeight * (numberOfLines ?? 4) + Spacing.three * 2,
    paddingVertical: Spacing.three,
    textAlignVertical: 'top' as const,
  } : null;
  return (
    <View style={styles.container}>
      <Text variant="small">{label}</Text>

      <TextInput
        accessibilityLabel={accessibilityLabel ?? label}
        placeholderTextColor={FieldColors.placeholder}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[styles.input, area, { borderColor: error ? Colors.error : FieldColors.border }]}
        {...inputProps}
      />

      {/* Abaixo do campo, perto de quem errou. No branco o vermelho passa, mas dentro do campo
          ele se confundiria com o que a pessoa digitou. */}
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
    gap: Spacing.two,
  },
  input: {
    ...Typography.body,
    minHeight: FIELD_HEIGHT,
    borderWidth: 1,
    borderRadius: Radius.control,
    paddingHorizontal: Spacing.three,
    backgroundColor: FieldColors.background,
    color: Colors.text,
  },
});
