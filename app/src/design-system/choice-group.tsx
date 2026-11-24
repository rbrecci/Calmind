import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import { ButtonVariants, Colors, MinTouchTarget, Radius, RoleColors, Spacing } from './tokens';

export type ChoiceOption<T> = { value: T; label: string };

export type ChoiceGroupProps<T extends string | number | null> = {
  label: string;
  options: readonly ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  tone: 'patient' | 'psychologist';
  disabled?: boolean;
};

// Escolha de uma opção entre poucas, em chips. A escolhida é cheia na cor do lado e as outras
// são contorno, então o estado se vê sem ler texto. Texto sobre a cor é o onAccent (RNF-35).
export function ChoiceGroup<T extends string | number | null>({
  label,
  options,
  value,
  onChange,
  tone,
  disabled = false,
}: ChoiceGroupProps<T>) {
  return (
    <View style={styles.container}>
      <Text variant="small">{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.options}>
        {options.map((option) => {
          const checked = option.value === value;
          const colors = disabled
            ? { background: checked ? Colors.disabled : Colors.background, border: Colors.disabled, text: Colors.onDisabled }
            : checked
              ? { background: RoleColors[tone].accent, border: RoleColors[tone].accent, text: RoleColors[tone].onAccent }
              : { background: ButtonVariants.secondary.background, border: ButtonVariants.secondary.border, text: ButtonVariants.secondary.text };
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked, disabled }}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={[styles.option, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={{ color: colors.text }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  option: {
    minHeight: MinTouchTarget, // RNF-35
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: Radius.md,
  },
});
